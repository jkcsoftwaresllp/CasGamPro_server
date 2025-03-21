import { logger } from "../../../../logger/logger.js";
import { GAME_TYPES } from "../types.js";

import { getGameHistory } from "../../../../database/queries/games/sqlGameHistoryHandler.js";

export async function gameHistoryHandler(gameType, limit = 15) {
  try {
    const history = await getGameHistory(gameType, limit);

    if (!history || history.length === 0) {
      logger.warn("No game history found in the database.");
      return [];
    }

    const parsedHistory = history.map((gameData) =>
      formatGameHistory(gameData, gameType)
    );

    return parsedHistory;
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
  switch (gameType) {
    case GAME_TYPES.DRAGON_TIGER:
      return gameData.winner.includes("dragon") ? "D" : "T";
    case GAME_TYPES.DRAGON_TIGER_TWO:
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
    case GAME_TYPES.LUCKY7A:
      return gameData.winner.includes("low")
        ? "L"
        : gameData.winner.includes("high")
        ? "H"
        : gameData.winner.includes("mid")
        ? "M"
        : null;
    case GAME_TYPES.TEEN_PATTI:
      return gameData.winner.includes("playerA") ? "A" : "B";

    default:
      return gameData.winner;
  }
}
