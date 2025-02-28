import { db } from "../../config/db.js";
import { ledger, players, rounds } from "../../database/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import socketManager from "../../services/shared/config/socket-manager.js";

// Record bet placement in ledger
export const recordBetPlacement = async (userId, roundId, stakeAmount) => {
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

    const newBalance = player.balance - stakeAmount;
    const commissionAmount = (stakeAmount * player.commission) / 100;

    // Update player balance
    await db
      .update(players)
      .set({ balance: newBalance })
      .where(eq(players.userId, userId));

    // Create ledger entry for bet placement
    await db.insert(ledger).values({
      userId,
      date: new Date(),
      entry: "Amount debited after placing bet",
      debit: stakeAmount,
      credit: 0,
      balance: newBalance,
      roundId,
      stakeAmount,
      status: "BET_PLACED",
      amount: commissionAmount, // Store commission amount
    });

    socketManager.broadcastWalletUpdate(userId, newBalance);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    logger.error("Error recording bet placement:", error);
    throw error;
  } finally {
    connection.release();
  }
};
