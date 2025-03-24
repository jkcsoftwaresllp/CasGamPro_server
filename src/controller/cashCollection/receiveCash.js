import { db } from "../../config/db.js";
import { users, ledger } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { createResponse } from "../../helper/responseHelper.js";

export const receiveCash = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    const receiverId = req.session.userId; // Logged-in user (Receiver)

    if (!userId || !amount) {
      return res
        .status(400)
        .json(
          createResponse("error", "CGP0067", "User ID and amount are required")
        );
    }

    // Verify the sender exists and is under this receiver
    const [sender] = await db.select().from(users).where(eq(users.id, userId));

    if (!sender) {
      return res
        .status(404)
        .json(createResponse("error", "CGP0068", "Sender not found"));
    }

    // Verify hierarchical structure
    if (sender.parent_id !== receiverId) {
      return res
        .status(403)
        .json(createResponse("error", "CGP0071", "Unauthorized transaction"));
    }

    // Start transaction
    const connection = await db.connection();
    await connection.beginTransaction();

    try {
      // Update receiver's balance
      await db
        .update(users)
        .set({ balance: sql`${users.balance} + ${amount}` })
        .where(eq(users.id, receiverId));

      // Update sender's balance
      await db
        .update(users)
        .set({ balance: sql`${users.balance} - ${amount}` })
        .where(eq(users.id, userId));

      // Record transaction in ledger
      await db.insert(ledger).values({
        userId: receiverId,
        relatedUserId: userId,
        transactionType: "DEPOSIT",
        entry: "Cash received",

        debit: 0,
        credit: amount,
        new_coins_balance: 0,
        new_exposure_balance: sender.balance,
        new_wallet_balance: sender.balance - parseFloat(amount),
        description,
        status: "COMPLETED",
      });

      await connection.commit();

      return res
        .status(200)
        .json(
          createResponse(
            "success",
            "CGP0069",
            "Cash receipt recorded successfully"
          )
        );
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    logger.error("Error in receiveCash:", error);
    return res.status(500).json(
      createResponse("error", "CGP0070", "Internal server error", {
        error: error.message,
      })
    );
  }
};
