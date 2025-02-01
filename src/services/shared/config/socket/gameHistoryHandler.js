import { logger } from "../../../../logger/logger.js";
import redis from "../../../../config/redis.js";

export async function gameHistoryHandler(gameType, limit = 15) {
  try {
    // Fetch entire game history from Redis
    const history = await redis.lrange("game_history", 0, -1);

    console.log(history);
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
      .map(formatGameHistory);

    return limitedHistory;
  } catch (error) {
    logger.error("Error fetching game history:", error);
    throw error;
  }
}

function formatGameHistory(gameData, gameType) {
  console.log(gameData);
  return {
    gameId: gameData.gameId,
    roundId: gameData.roundId,
    winner: getWinner(gameData, gameType),
  };
}

function getWinner(gameData, gameType) {
  switch (gameType) {
    case "DragonTiger":
      return gameData.winner === "dragon" ? "D" : "T";
    case "AndarBahar":
      return gameData.winner === "andar" ? "A" : "B";
    case "Lucky7B":
      return gameData.winner === "low"
        ? "L"
        : gameData.winner === "high"
        ? "H"
        : gameData.winner === "mid"
        ? "M"
        : null;
    default:
      return gameData.winner;
  }
}
