import { getBetMultiplier } from "./getBetMultiplier.js";
import { users, game_bets, ledger } from "../../../database/schema.js";
import { eq } from "drizzle-orm";
import { GAME_TYPES, PARENT_TYPES } from "../config/types.js";
import SocketManager from "../config/socket-manager.js";
import { formatDate } from "../../../utils/formatDate.js";
import { fetchBetsForRound, getCasinoCut, insertIntoLedger } from "../../../database/queries/balance/distribute.js";
import { db, pool } from "../../../config/db.js";

export const aggregateBets = async (roundId) => {
  try {
    // Fetch all bets for the given roundId
    const betData = await fetchBetsForRound(roundId);

    // Aggregate the sum manually using JavaScript
    const summary = betData.reduce((acc, bet) => {
      acc[bet.bet_side] = (acc[bet.bet_side] || 0) + bet.bet_amount;
      return acc;
    }, {});

    return summary;
  } catch (error) {
    console.error("Error fetching bet summary:", error);
    throw error;
  }
};

async function distributeHierarchyProfits(userId, totalBetAmount, netLoss) {
  try {
    let remainingProfit = Math.abs(netLoss); // Convert loss to positive profit
    let currentUserId = userId;

    while (remainingProfit > 0) {
      // Get parent info and their commission/share rates
      const parentInfo = await db
        .select({
          parentId: users.parent_id,
          parentRole: users.role
        })
        .from(users)
        .where(eq(users.id, currentUserId))
        .limit(1);

      if (!parentInfo.length || !parentInfo[0].parentId) {
        // No more parents, remaining goes to admin
        await updateAdminBalance(remainingProfit);
        await createLedgerEntry(null, remainingProfit, "ADMIN_PROFIT");
        break;
      }

      const parentId = parentInfo[0].parentId;

      // Get parent's share and commission rates
      const parentRates = await db
        .select({
          share: user_limits_commissions.max_share,
          commission: user_limits_commissions.max_casino_commission
        })
        .from(user_limits_commissions)
        .where(eq(user_limits_commissions.user_id, parentId))
        .limit(1);

      if (parentRates.length) {
        const { share, commission } = parentRates[0];

        // Calculate share amount
        const shareAmount = (remainingProfit * share) / 100;

        // Calculate commission amount
        const commissionAmount = (totalBetAmount * commission) / 100;

        // Total amount for this parent
        const totalParentAmount = shareAmount + commissionAmount;

        // Update parent's balance
        await updateParentBalance(parentId, totalParentAmount);

        // Create ledger entry for parent
        await createLedgerEntry(parentId, totalParentAmount, "COMMISSION");

        // Update remaining profit
        remainingProfit -= shareAmount;

        // Move up the hierarchy
        currentUserId = parentId;
      }
    }
  } catch (error) {
    console.error("Error in profit distribution:", error);
    throw error;
  }
}

async function updateParentBalance(parentId, amount) {
  await db
    .update(users)
    .set({
      balance: db.sql`balance + ${amount}`
    })
    .where(eq(users.id, parentId));
}

async function updateAdminBalance(amount) {
  await db
    .update(users)
    .set({
      balance: db.sql`balance + ${amount}`
    })
    .where(eq(users.role, 'ADMIN'));
}

async function createLedgerEntry(userId, amount, type, roundId = null) {
  const entry = {
    user_id: userId,
    round_id: roundId,
    transaction_type: type,
    entry: `${type} - ${formatDate(new Date())}`,
    amount: amount,
    credit: amount,
    debit: 0,
    previous_balance: 0, // This should be fetched before update
    new_balance: 0, // This should be calculated after update
    status: "COMPLETED",
    stake_amount: amount,
    description: `${type} transaction`
  };

  if (userId) {
    // Get previous balance
    const userBalance = await db
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userBalance.length) {
      entry.previous_balance = userBalance[0].balance;
      entry.new_balance = userBalance[0].balance + amount;
    }
  }

  await db.insert(ledger).values(entry);
}

export async function distributeWinnings() {
  try {
    const winners = new Map();
    const isMultiWinnerGame = [
      GAME_TYPES.LUCKY7B,
      GAME_TYPES.LUCKY7A,
      GAME_TYPES.DRAGON_TIGER,
      GAME_TYPES.DRAGON_TIGER_TWO,
      GAME_TYPES.DRAGON_TIGER_LION,
      GAME_TYPES.ANDAR_BAHAR,
    ].includes(this.gameType);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Calculate winnings for each user's bets
      for (const [userId, userBets] of this.bets) {
        let totalBetAmount = 0;
        let totalWinAmount = 0;
        let winningBets = [];

        // Get current balance from database
        const [userRow] = await db
          .select({
            id: users.id,
            balance: users.balance,
            role: users.role,
            parentId: users.parent_id
          })
          .from(users)
          .where(eq(users.id, userId));

        if (!userRow) {
          console.error(`No user found for userId: ${userId}`);
          continue;
        }

        // Calculate totals for all bets
        for (const bet of userBets) {
          totalBetAmount += parseFloat(bet.stake);

          if (this.winner.includes(bet.side)) {
            const multiplier = await getBetMultiplier(this.gameType, bet.side);
            const winAmount = parseFloat(bet.stake) * parseFloat(multiplier);
            totalWinAmount += winAmount;
            winningBets.push({ ...bet, winAmount });
          }
        }

        // Calculate net profit/loss
        const netAmount = totalWinAmount - totalBetAmount;

        // Update game_bets records
        for (const bet of winningBets) {
          await db
            .update(game_bets)
            .set({
              win_amount: bet.winAmount
            })
            .where(eq(game_bets.id, bet.id));
        }

        // Update user balance
        const newBalance = parseFloat(userRow.balance) + netAmount;
        await db
          .update(users)
          .set({
            balance: newBalance
          })
          .where(eq(users.id, userId));

        // Create ledger entry for player
        await createLedgerEntry(
          userId,
          netAmount,
          netAmount > 0 ? "WIN" : "LOSE",
          this.roundId
        );

        // If it's a loss, distribute up the hierarchy
        if (netAmount < 0) {
          await distributeHierarchyProfits(userId, totalBetAmount, netAmount);
        }

        // Store winner info for broadcasting
        if (totalWinAmount > 0) {
          winners.set(userId, {
            oldBalance: userRow.balance,
            newBalance,
            totalWinAmount,
            winningBets,
          });
        }

        // Broadcast wallet update
        SocketManager.broadcastWalletUpdate(userId, newBalance);
      }

      await connection.commit();

      // Clear the betting maps for next round
      this.bets.clear();

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(
      `Error distributing winnings for round ${this.roundId}:`,
      error
    );
    throw error;
  }
}
