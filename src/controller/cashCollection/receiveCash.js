import { db } from "../../config/db.js";
import { cashLedger } from "../../database/schema.js";
import { eq, desc } from "drizzle-orm";
import { logger } from "../../logger/logger.js";

export const receiveCash = async (req, res) => {
  try {
    const { playerId, amount, note } = req.body;
    const agentId = req.session.userId;

    // Input validation
    if (!agentId || !playerId || !amount) {
      return res.status(400).json({
        uniqueCode: "CGP0182",
        message: "Missing required fields",
        data: {},
      });
    }

    // Fetch the last transaction for this player
    const lastTransaction = await db
      .select({
        id: cashLedger.id,
        amount: cashLedger.amount,
      })
      .from(cashLedger)
      .where(eq(cashLedger.playerId, playerId))
      .orderBy(desc(cashLedger.id))
      .limit(1);

    if (lastTransaction.length > 0) {
      const lastAmount = Number(lastTransaction[0].amount);
      const newAmount = lastAmount + Number(amount);

      // Update the last transaction with the new amount
      await db
        .update(cashLedger)
        .set({
          amount: newAmount,
          updatedAt: new Date(),
        })
        .where(eq(cashLedger.id, lastTransaction[0].id));
    } else {
      await db.insert(cashLedger).values({
        agentId,
        playerId,
        amount,
        transactionType: "TAKE",
        description: note,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

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
