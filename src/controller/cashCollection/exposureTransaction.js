import { db } from "../../config/db.js";
import { users } from "../../database/schema.js";
import { eq, and } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { createResponse } from "../../helper/responseHelper.js";
import { createLedgerEntry } from "../../database/queries/panels/createLedgerEntry.js";

export const exposureTransaction = async (req, res) => {
  try {
    const { userId, amount, note: description, type } = req.body;
    const ownerId = req.session.userId; // Logged-in user (payer)

    // Validate required fields
    if (!userId || !amount || !type || !["pay", "receive"].includes(type)) {
      return res
        .status(400)
        .json(
          createResponse(
            "error",
            "CGP0063",
            "User ID, transaction type, and amount are required"
          )
        );
    }

    // Fetch user details with current exposure
    const [user] = await db
      .select({ exposure: users.exposure })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.parent_id, ownerId)));

    if (!user) {
      return res
        .status(404)
        .json(
          createResponse(
            "error",
            "CGP0064",
            "Either user not found or not under your supervision"
          )
        );
    }

    // Calculate new exposure manually
    const newExposure =
      type === "pay"
        ? parseFloat(user.exposure) - parseFloat(amount)
        : parseFloat(user.exposure) + parseFloat(amount);

    // Start transaction
    await db.transaction(async (tx) => {
      // Update exposure balance with manually calculated value
      await tx
        .update(users)
        .set({ exposure: newExposure.toFixed(2) })
        .where(eq(users.id, userId));

      // Create ledger entry
      await createLedgerEntry({
        userId: userId,
        roundId: null,
        type: type === "pay" ? "GIVE" : "TAKE",
        entry: description,
        balanceType: "exposure",
        amount: amount,
        tx, // Pass transaction instance
      });
    });

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
    logger.error("Error in exposureTransaction:", error);
    return res.status(500).json(
      createResponse("error", "CGP0066", "Internal server error", {
        error: error.message,
      })
    );
  }
};
