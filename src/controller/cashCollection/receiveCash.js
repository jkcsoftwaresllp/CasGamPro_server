import { db } from "../../config/db.js";
import { cashLedger, players } from "../../database/schema.js";
import { eq, desc } from "drizzle-orm";
import { logger } from "../../logger/logger.js";

export const receiveCash = async (req, res) => {
  try {
    const { playerId: userId, amount, note } = req.body;
    const agentId = req.session.userId;

    if (!agentId || !userId || !amount) {
      return res.status(400).json({
        uniqueCode: "CGP0182",
        message: "Missing required fields",
        data: {},
      });
    }

    const playerData = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.userId, userId))
      .limit(1);

    if (playerData.length === 0) {
      return res.status(400).json({
        uniqueCode: "CGP0185",
        message: "Invalid userId. Player does not exist.",
        data: {},
      });
    }

    const playerId = playerData[0].id;

    // Fetch last transaction amount
    const lastTransaction = await db
      .select({ amount: cashLedger.amount })
      .from(cashLedger)
      .where(eq(cashLedger.playerId, playerId))
      .orderBy(desc(cashLedger.id))
      .limit(1);

    const lastAmount =
      lastTransaction.length > 0 ? Number(lastTransaction[0].amount) : 0;
    const currAmount = amount;
    const newAmount = lastAmount + Number(amount);

    await db.insert(cashLedger).values({
      agentId,
      playerId,
      amount: newAmount,
      previousBalance: currAmount,
      transactionType: "TAKE", // mil gya hai
      description: note,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(200).json({
      uniqueCode: "CGP0183",
      message: "Transaction recorded successfully",
      data: {},
    });
  } catch (error) {
    logger.error("Error in receiveCash:", error);
    return res.status(500).json({
      uniqueCode: "CGP0184",
      message: "Internal server error",
      data: {},
    });
  }
};
