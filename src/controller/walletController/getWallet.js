import { db } from "../../config/db.js"; // Import db instance
import { players } from "../../database/schema.js"; // Import players table schema
import { eq } from "drizzle-orm";
//import { broadcastWalletUpdate } from "../../services/shared/configs/socket/walletHandler.js";


export const getWallet = async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(400).json({
      uniqueCode: "CGP0021",
      message: "User ID is required",
      data: {},
    });
  }

  try {
    // Query the players table to get the balance for the user
    const playerData = await db
      .select()
      .from(players)
      .where(eq(players.userId, userId));

    if (playerData.length === 0) {
      return res.status(404).json({
        uniqueCode: "CGP0022",
        message: "User not found",
        data: {},
      });
    }

    /* Broadcast wallet update through socket
    if (global.walletIO) {
      await broadcastWalletUpdate(global.walletIO, userId, playerData[0].balance);
    } */

    res.status(200).json({
      uniqueCode: "CGP0023",
      message: "",
      data: { walletPoints: playerData[0].balance }, // Send the balance
    });
  } catch (error) {
    res.status(500).json({
      uniqueCode: "CGP0024",
      message: "Error fetching wallet balance",
      data: {
        error: error.message,
      },
    });
  }
};
