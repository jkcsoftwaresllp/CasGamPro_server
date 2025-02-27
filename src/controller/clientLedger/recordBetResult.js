import { db } from "../../config/db.js";
import { ledger, players, rounds } from "../../database/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import socketManager from "../../services/shared/config/socket-manager.js";

// Record bet result in ledger
export const recordBetResult = async (userId, roundId, isWinner, amount) => {
  const connection = await db.connection();

  try {
    await connection.beginTransaction();

    // Get current balance and commission rate
    const [player] = await db
      .select({
        id: players.id,
        balance: players.balance,
        commission: players.casinoCommission,
      })
      .from(players)
      .where(eq(players.userId, userId));

    if (!player) {
      throw new Error("Player not found");
    }

    // Get original bet entry
    const [betEntry] = await db
      .select()
      .from(ledger)
      .where(eq(ledger.roundId, roundId))
      .where(eq(ledger.userId, userId))
      .where(eq(ledger.status, "BET_PLACED"));

    if (!betEntry) {
      throw new Error("Original bet entry not found");
    }

    let newBalance = player.balance;
    let debitAmount = 0;
    let creditAmount = 0;
    let status;
    let commissionAmount = 0;

    if (isWinner) {
      creditAmount = amount;
      newBalance += amount;
      status = "WIN";
      // Calculate commission on winnings
      commissionAmount = (amount * player.commission) / 100;
    } else {
      debitAmount = betEntry.stakeAmount;
      status = "LOSS";
      // Commission already calculated on bet placement
      commissionAmount = betEntry.amount;
    }

    // Update player balance
    await db
      .update(players)
      .set({ balance: newBalance })
      .where(eq(players.userId, userId));

    // Create ledger entry for win/loss
    await db.insert(ledger).values({
      userId,
      date: new Date(),
      entry: isWinner ? "Winning Allocated" : "Bet Lost",
      debit: debitAmount,
      credit: creditAmount,
      balance: newBalance,
      roundId,
      amount: commissionAmount,
      status,
      result: status,
    });

    socketManager.broadcastWalletUpdate(userId, newBalance);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    logger.error("Error recording bet result:", error);
    throw error;
  } finally {
    connection.release();
  }
};
