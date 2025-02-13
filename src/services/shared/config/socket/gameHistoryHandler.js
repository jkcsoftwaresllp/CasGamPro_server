import { logger } from "../../../../logger/logger.js";
import redis from "../../../../config/redis.js";
import { GAME_TYPES } from "../types.js";

export async function gameHistoryHandler(gameType, limit = 15) {
  return ;
  try {
    // Fetch entire game history from Redis
    const history = await redis.lrange("game_history", 0, -1);

    if (!history || history.length === 0) {
      logger.warn("No game history found in Redis.");
      return [];
    }

    // Parse all history entries
    const parsedHistory = history
      .map((game) => {
        try {
          return JSON.parse(game);
        } catch (error) {
          logger.error("Error parsing game history:", error);
          return null;
        }
      })
      .filter(Boolean); // Remove null values from failed JSON parsing

    // Filter history based on gameType
    const filteredHistory = parsedHistory.filter((gameData) => {
      return gameData.gameId.includes(gameType);
    });

    // Limit the result to the given limit
    const limitedHistory = filteredHistory
      .slice(0, limit)
      .map((his) => formatGameHistory(his, gameType));

    return limitedHistory;
  } catch (error) {
    logger.error("Error fetching game history:", error);
    throw error;
  }
}

function formatGameHistory(gameData, gameType) {
  return {
    gameName: gameType,
    roundId: gameData.gameId,
    winner: getWinner(gameData, gameType),
  };
}

function getWinner(gameData, gameType) {
  // console.log(gameData.winner, gameData.gameId);
  switch (gameType) {
    case GAME_TYPES.DRAGON_TIGER:
      return gameData.winner.includes("dragon") ? "D" : "T";
    case GAME_TYPES.ANDAR_BAHAR:
      return gameData.winner.includes("andar") ? "A" : "B";
    case GAME_TYPES.ANDAR_BAHAR_TWO:
      return gameData.winner.includes("andar") ? "A" : "B";
    case GAME_TYPES.LUCKY7B:
      return gameData.winner.includes("low")
        ? "L"
        : gameData.winner.includes("high")
        ? "H"
        : gameData.winner.includes("mid")
        ? "M"
        : null;
    case GAME_TYPES.TEEN_PATTI:
      return gameData.winner === "playerA" ? "A" : "B";

    default:
      return gameData.winner;
  }
}
