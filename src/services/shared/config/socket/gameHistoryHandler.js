import { logger } from "../../../../logger/logger.js";
import redis from "../../../../config/redis.js";

export const gameHistoryHandler = (io) => {
  const historyIO = io.of("/game-history");

  historyIO.on("connection", async (socket) => {
    logger.info("Client connected to game history namespace");

    socket.on("joinGameHistory", async (gameType) => {
      console.log("Joined");
      try {
        socket.join(`history:${gameType}`);
        const history = await getGameHistory(gameType);
        socket.emit("historyUpdate", history);
      } catch (error) {
        logger.error("Error joining game history:", error);
        socket.emit("error", "Failed to join game history");
      }
    });

    socket.on("leaveGameHistory", (gameType) => {
      socket.leave(`history:${gameType}`);
    });

    socket.on("disconnect", () => {
      logger.info("Client disconnected from game history namespace");
    });
  });

  return historyIO;
};

async function getGameHistory(gameType, limit = 50) {
  try {
    const history = await redis.lrange("game_history", 0, limit - 1);
    return history
      .map((game) => {
        try {
          const gameData = JSON.parse(game);
          if (!gameType || gameData.gameType === gameType) {
            return formatGameHistory(gameData);
          }
          return null;
        } catch (error) {
          logger.error("Error parsing game history:", error);
          return null;
        }
      })
      .filter(Boolean);
  } catch (error) {
    logger.error("Error fetching game history:", error);
    throw error;
  }
}

function formatGameHistory(gameData) {
  const baseInfo = {
    gameId: gameData.gameId,
    roundId: gameData.roundId,
    gameType: gameData.gameType,
    timestamp: gameData.timestamp,
    winner: gameData.winner,
  };

  switch (gameData.gameType) {
    case "DragonTiger":
      return {
        ...baseInfo,
        cards: {
          dragon: gameData.dragonCard,
          tiger: gameData.tigerCard,
        },
        result: {
          winner: gameData.winner,
          tie: gameData.winner === "tie",
          pair: gameData.pair || false,
        },
      };

    case "TeenPatti":
      return {
        ...baseInfo,
        cards: {
          player1: gameData.player1Cards,
          player2: gameData.player2Cards,
        },
      };

    case "Lucky7B":
      return {
        ...baseInfo,
        cards: {
          second: gameData.secondCard,
        },
        result: gameData.bettingResults,
      };

    case "AndarBahar":
      return {
        ...baseInfo,
        cards: {
          joker: gameData.jokerCard,
          andar: gameData.andarCards,
          bahar: gameData.baharCards,
        },
      };

    default:
      return baseInfo;
  }
}

export const broadcastGameResult = async (gameIO, gameData) => {
  try {
    const formattedHistory = formatGameHistory(gameData);
    gameIO
      .to(`history:${gameData.gameType}`)
      .emit("newGameResult", formattedHistory);
  } catch (error) {
    logger.error("Error broadcasting game result:", error);
  }
};
