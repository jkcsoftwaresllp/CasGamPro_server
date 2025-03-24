import { db } from "../../config/db.js";
import { users, ledger } from "../../database/schema.js";
import { eq, and } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { createResponse } from "../../helper/responseHelper.js";

export const payCash = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    const payerId = req.session.userId; // Logged-in user (payer)

    if (!userId || !amount) {
      return res
        .status(400)
        .json(
          createResponse("error", "CGP0063", "User ID and amount are required")
        );
    }

    // Fetch payer details
    const [payer] = await db.select().from(users).where(eq(users.id, payerId));

    if (!payer) {
      return res
        .status(404)
        .json(createResponse("error", "CGP0064", "Payer not found"));
    }

    // Fetch payee details
    const [payee] = await db.select().from(users).where(eq(users.id, userId));

    if (!payee) {
      return res
        .status(404)
        .json(createResponse("error", "CGP0064", "Payee not found"));
    }

    // Ensure the payee is the direct parent of the payer (hierarchy validation)
    if (payee.id !== payer.parent_id) {
      return res
        .status(403)
        .json(
          createResponse(
            "error",
            "CGP0067",
            "Unauthorized payment. Can only pay direct parent."
          )
        );
    }

    // Start transaction
    const connection = await db.connection();
    await connection.beginTransaction();

    try {
      // Deduct amount from payer
      await db
        .update(users)
        .set({ balance: sql`${users.balance} - ${amount}` })
        .where(eq(users.id, payerId));

      // Add amount to payee
      await db
        .update(users)
        .set({ balance: sql`${users.balance} + ${amount}` })
        .where(eq(users.id, userId));

      // Record transaction in ledger
      await db.insert(ledger).values({
        userId: payerId,
        relatedUserId: userId,
        transactionType: "WITHDRAWAL",
        entry: "Cash payment",
        debit: amount,
        credit: 0,
        new_coins_balance: 0,
        new_exposure_balance: payer.balance,
        new_wallet_balance: payer.balance - parseFloat(amount),

        description,
        status: "COMPLETED",
      });

      await connection.commit();

      return res
        .status(200)
        .json(
          createResponse(
            "success",
            "CGP0065",
            "Cash payment recorded successfully"
          )
        );
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    logger.error("Error in payCash:", error);
    return res
      .status(500)
      .json(
        createResponse("error", "CGP0066", "Internal server error", {
          error: error.message,
        })
      );
  }
};
