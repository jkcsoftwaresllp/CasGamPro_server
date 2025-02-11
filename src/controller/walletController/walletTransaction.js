import { db } from "../../config/db.js";
import { players } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import Decimal from "decimal.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const walletTransaction = async (req, res) => {
  const { userId, type, amount } = req.body;

  if (!userId || !type || !amount) {
    let temp = {
      uniqueCode: "CGP0057",
      message: "User ID, type, and amount are required",
      data: {},
    };
    logToFolderError("Wallet/controller", "walletTransaction", temp);
    return res.status(400).json(temp);
  }

  if (amount <= 0) {
    let temp2 = {
      uniqueCode: "CGP0064",
      message: "Invalid amount",
      data: {},
    };
    logToFolderError("Wallet/controller", "walletTransaction", temp2);
    return res.status(400).json(temp2);
  }

  try {
    // Fetch current user balance
    const user = await db
      .select()
      .from(players)
      .where(eq(players.userId, userId))
      .limit(1);

    if (!user.length) {
      let temp3 = {
        uniqueCode: "CGP0059",
        message: "User not found",
        data: {},
      };
      logToFolderInfo("Wallet/controller", "walletTransaction", temp3);
      return res.status(404).json(temp3);
    }

    const currentBalance = new Decimal(user[0].balance);
    let newBalance;

    if (type === "deposit") {
      newBalance = currentBalance.plus(amount);
    } else if (type === "withdraw") {
      if (currentBalance.lessThan(amount)) {
        let temp4 = {
          uniqueCode: "CGP0060",
          message: "Insufficient balance for withdrawal",
          data: {},
        };
        logToFolderInfo("Wallet/controller", "walletTransaction", temp4);
        return res.status(400).json(temp4);
      }
      newBalance = currentBalance.minus(amount);
    } else {
      let temp5 = {
        uniqueCode: "CGP0061",
        message: "Invalid transaction type",
        data: {},
      };
      logToFolderError("Wallet/controller", "walletTransaction", temp5);
      return res.status(400).json(temp5);
    }

    // Update the user's wallet balance
    await db
      .update(players)
      .set({ balance: newBalance.toFixed(2) })
      .where(eq(players.userId, userId));

    let temp6 = {
      uniqueCode: "CGP0062",
      message: "Transaction successful",
      data: { balance: newBalance.toFixed(2) },
    };
    logToFolderInfo("Wallet/controller", "walletTransaction", temp6);
    return res.status(200).json(temp6);
  } catch (error) {
    let temp7 = {
      uniqueCode: "CGP0063",
      message: "Internal Server Error",
      data: { error: error.message },
    };
    logToFolderError("Wallet/controller", "walletTransaction", temp7);
    return res.status(500).json(temp7);
  }
};
