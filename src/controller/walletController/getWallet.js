import { eq } from "drizzle-orm";
import { db } from "../../config/db.js"; // Import db instance
import { players } from "../../database/schema.js"; // Import players table schema
//import { broadcastWalletUpdate } from "../../services/shared/configs/socket/walletHandler.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const getWallet = async (req, res) => {
  const userId = req.session.userId; // Get the user ID from the request

  if (!userId) {
    let temp = {
      uniqueCode: "CGP0021",
      message: "User ID is required",
      data: {},
    };
    logToFolderError("Wallet/controller", "getWallet", temp);
    return res.status(400).json(temp);
  }

  try {
    // Query the players table to get the balance for the user
    const playerData = await db
      .select()
      .from(players)
      .where(eq(players.userId, userId));
    if (playerData.length === 0) {
      let temp2 = {
        uniqueCode: "CGP0022",
        message: "User not found",
        data: {},
      };
      logToFolderInfo("Wallet/controller", "getWallet", temp2);
      return res.status(404).json(temp2);
    }

    /* Broadcast wallet update through socket
    if (global.walletIO) {
      await broadcastWalletUpdate(global.walletIO, userId, playerData[0].balance);
    } */

    let temp3 = {
      uniqueCode: "CGP0023",
      message: "Wallet balance retrieved successfully",
      data: { walletPoints: playerData[0].balance }, // Send the balance
    };
    logToFolderInfo("Wallet/controller", "getWallet", temp3);
    return res.status(200).json(temp3);
  } catch (error) {
    let temp4 = {
      uniqueCode: "CGP0024",
      message: "Error fetching wallet balance",
      data: { error: error.message },
    };
    logToFolderError("Wallet/controller", "getWallet", temp4);
    return res.status(500).json(temp4);
  }
};
