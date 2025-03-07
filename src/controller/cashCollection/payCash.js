import { db } from "../../config/db.js";
import { cashLedger } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { logger } from "../../logger/logger.js";

export const payCash = async (req, res) => {
  try {
    const { playerId, amount, note } = req.body;
    const agentId = req.session.userId;
    // Input validation
    if (!agentId || !playerId || !amount) {
      return res.status(400).json({
        uniqueCode: "CGP0166",
        message: "Missing required fields",
        data: {},
      });
    }

    // Insert into agent transactions
    await db.insert(cashLedger).values({
      agentId,
      playerId,
      amount: -amount,
      transactionType: "GIVE",
      description: note,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(200).json({
      uniqueCode: "CGP0167",
      message: "Transaction recorded successfully",
      data: {},
    });
  } catch (error) {
    logger.error("Error in receiveCash:", error);
    return res.status(500).json({
      uniqueCode: "CGP0168",
      message: "Internal server error",
      data: {},
    });
  }
};
