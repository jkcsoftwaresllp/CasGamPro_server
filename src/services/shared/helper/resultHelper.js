import { getBetMultiplier } from "./getBetMultiplier.js";
import {
  users,
  game_bets,
  ledger,
  user_limits_commissions,
} from "../../../database/schema.js";
import { eq, sql } from "drizzle-orm";
import { GAME_TYPES, PARENT_TYPES } from "../config/types.js";
import SocketManager from "../config/socket-manager.js";
import { formatDate } from "../../../utils/formatDate.js";
import {
  fetchBetsForRound,
  getCasinoCut,
  insertIntoLedger,
} from "../../../database/queries/balance/distribute.js";
import { db, pool } from "../../../config/db.js";
import { adminId } from "../../../database/seedFile/seedUsers.js";
import {
  getAllBets,
  calculationForClients,
  calculationForUpper,
  calculationForAdmin,
} from "./winningDirstributionHelper.js";
import { folderLogger } from "../../../logger/folderLogger.js";

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

async function distributeHierarchyProfits(
  userId,
  totalBetAmount,
  netLoss,
  roundId = null
) {
  try {
    let remainingProfit = Math.abs(netLoss); // Convert loss to positive profit
    let currentUserId = userId;

    while (remainingProfit > 0) {
      // Get parent info and their commission/share rates
      const parentInfo = await db
        .select({
          parentId: users.parent_id,
          parentRole: users.role,
        })
        .from(users)
        .where(eq(users.id, currentUserId))
        .limit(1);

      if (!parentInfo.length || !parentInfo[0].parentId) {
        // No more parents, remaining goes to admin
        await updateAdminBalance(remainingProfit);
        await createLedgerEntry(
          adminId,
          remainingProfit,
          "ADMIN_PROFIT",
          roundId
        );
        break;
      }

      const parentId = parentInfo[0].parentId;

      // Get parent's share and commission rates
      const parentRates = await db
        .select({
          share: user_limits_commissions.max_share,
          commission: user_limits_commissions.max_casino_commission,
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
        await createLedgerEntry(
          parentId,
          totalParentAmount,
          "COMMISSION",
          roundId
        );

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
      balance: sql`balance + ${amount}`,
    })
    .where(eq(users.id, parentId));
}

async function updateAdminBalance(amount) {
  await db
    .update(users)
    .set({
      balance: sql`balance + ${amount}`,
    })
    .where(eq(users.role, "ADMIN"));
}

export async function createLedgerEntry(
  userId,
  amount,
  type,
  roundId = null,
  entry
) {
  const ledgerEntry = {
    user_id: userId,
    round_id: roundId,
    transaction_type: type,
    entry: entry,
    credit: amount,
    debit: 0,
    amount: amount,
    previous_balance: 0, // This should be fetched before update
    new_balance: 0, // This should be calculated after update
    status: "COMPLETED",
    stake_amount: amount,
    description: `${type} transaction`,
  };

  if (userId) {
    // Get previous balance
    const userBalance = await db
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userBalance.length) {
      ledgerEntry.previous_balance = userBalance[0].balance;
      ledgerEntry.new_balance = parseFloat(userBalance[0].balance) + amount;
    }
  }

  await db.insert(ledger).values(ledgerEntry);
}

export async function distributeWinnings() {
  try {
    const winners = this.winner,
      gameType = this.gameType,
      roundId = this.roundId;

    const allBets = await getAllBets(roundId);
    folderLogger("distribution", 'profit-distribution').info(`\n******************* Users **********************\n`);

    const agentPL = await calculationForClients(
      allBets,
      winners,
      gameType,
      roundId
    );

    folderLogger("distribution", 'profit-distribution').info(`\n******************* Agents **********************\n`);
    const superAgentPL = await calculationForUpper(agentPL, roundId);

    folderLogger("distribution", 'profit-distribution').info(`\n******************* Super Agents **********************\n`);
    const adminPL = await calculationForUpper(superAgentPL, roundId);

    folderLogger("distribution", 'profit-distribution').info(`\n******************* Admin **********************\n`);
    await calculationForAdmin(adminPL, roundId);

    // Clear the betting maps for next round
    this.bets.clear();
  } catch (error) {
    console.error(
      `Error distributing winnings for round ${this.roundId}:`,
      error
    );
    throw error;
  }
}

export async function distributeWinnings1() {
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

      const winners = this.winner,
        gameType = this.gameType,
        roundId = this.roundId;

      const allBets = await getAllBets(roundId);
      const agentPL = await calculationForClients(
        allBets,
        winners,
        gameType,
        roundId
      );

      const superAgentPL = calculationForUpper(agentPL, roundId);
      const adminPL = calculationForUpper(superAgentPL, roundId);

      // **************************************************************************

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
