import { db } from "../../config/db.js";
import { users, ledger } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { createResponse } from "../../helper/responseHelper.js";

export const receiveCash = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    const agentId = req.session.userId;

    if (!userId || !amount) {
      return res.status(400).json(
        createResponse("error", "CGP0067", "User ID and amount are required")
      );
    }

    // Verify the user exists and is under this agent
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, userId),
        eq(users.parent_id, agentId),
        eq(users.role, "PLAYER")
      ));

    if (!user) {
      return res.status(404).json(
        createResponse("error", "CGP0068", "User not found or not under your control")
      );
    }

    // Start transaction
    const connection = await db.connection();
    await connection.beginTransaction();

    try {
      // Update agent's balance
      await db
        .update(users)
        .set({ balance: sql`${users.balance} + ${amount}` })
        .where(eq(users.id, agentId));

      // Update player's balance
      await db
        .update(users)
        .set({ balance: sql`${users.balance} - ${amount}` })
        .where(eq(users.id, userId));

      // Record transaction in ledger
      await db.insert(ledger).values({
        userId: agentId,
        relatedUserId: userId,
        transactionType: "DEPOSIT",
        entry: "Cash received from player",
        amount,
        debit: 0,
        credit: amount,
        previousBalance: user.balance,
        newBalance: user.balance - parseFloat(amount),
        description,
        status: "COMPLETED",
      });

      await connection.commit();

      return res.status(200).json(
        createResponse("success", "CGP0069", "Cash receipt recorded successfully")
      );

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    logger.error("Error in receiveCash:", error);
    return res.status(500).json(
      createResponse("error", "CGP0070", "Internal server error", { error: error.message })
    );
  }
};