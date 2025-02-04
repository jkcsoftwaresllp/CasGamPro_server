import { db } from "../../config/db.js";
import { players } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import Decimal from "decimal.js";

export const walletTransaction = async (req, res) => {
  const { userId, type, amount } = req.body;

  if (!userId || !type || !amount) {
    return res.status(400).json({
      uniqueCode: "CGP0057",
      message: "User ID, type, and amount are required",
      data: {},
    });
  }
  if (amount <= 0) {
    return res
      .status(400)
      .json({ uniqueCode: "CGP0064", message: "Invalid amount", data: {} });
  }

  try {
    //Fetch current user balance
    const user = await db
      .select()
      .from(players)
      .where(eq(players.userId, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        uniqueCode: "CGP0059",
        message: "User not found",
        data: {},
      });
    }

    const currentBalance = new Decimal(user[0].balance);
    console.log("Current balance:", currentBalance);
    let newBalance;

    if (type === "deposit") {
      newBalance = currentBalance.plus(amount);
    } else if (type === "withdraw") {
      if (currentBalance.lessThan(amount)) {
        return res.status(400).json({
          uniqueCode: "CGP0060",
          message: "Insufficient balance for withdrawal",
          data: {},
        });
      }
      newBalance = currentBalance.minus(amount);
    } else {
      return res.status(400).json({
        uniqueCode: "CGP0061",
        message: "Invalid transaction type",
        data: {},
      });
    }

    // Update the user's wallet balance
    await db
      .update(players)
      .set({ balance: newBalance.toFixed(2) })
      .where(players.userId, eq(userId));

    // Return success response
    return res.json({
      uniqueCode: "CGP0062",
      message: "Transaction successful",
      // data: { balance: newBalance.toFixed(2) },
    });
  } catch (error) {
    console.error("Error processing transaction:", error);
    return res.status(500).json({
      uniqueCode: "CGP0063",
      message: "Internal Server Error",
      data: {},
    });
  }
};
