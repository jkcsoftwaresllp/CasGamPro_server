import { logger } from "../../../../logger/logger.js";
import { db } from "../../../../config/db.js";
import { players } from "../../../../database/schema.js";

export const walletHandler = (io) => {
  const walletIO = io.of("/wallet");

  walletIO.on("connection", async (socket) => {
    logger.info("Client connected to wallet namespace");

    socket.on("joinWallet", async (userId) => {
      try {
        if (!userId) {
          throw new Error("User ID is required");
        }

        socket.join(`wallet:${userId}`);

        const playerData = await db
          .select()
          .from(players)
          .where(players.userId.eq(userId));

        if (playerData.length > 0) {
          socket.emit("walletUpdate", {
            balance: playerData[0].balance,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        logger.error("Error joining wallet:", error);
        socket.emit("error", "Failed to join wallet");
      }
    });

    socket.on("leaveWallet", (userId) => {
      if (userId) {
        socket.leave(`wallet:${userId}`);
      }
    });

    socket.on("disconnect", () => {
      logger.info("Client disconnected from wallet namespace");
    });
  });

  return walletIO;
};

export const broadcastWalletUpdate = async (walletIO, userId, balance) => {
  try {
    walletIO.to(`wallet:${userId}`).emit("walletUpdate", {
      balance,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error("Error broadcasting wallet update:", error);
  }
};