import { logger } from "../../logger/logger.js";
import {
  GAME_TYPES,
  GAME_CONFIGS,
  getGameConfig,
} from "../../services/shared/config/types.js";
import { eq, desc } from "drizzle-orm";
import { db } from "../../config/db.js";
import { rounds } from "../../database/schema.js";
import { getGameName } from "../../utils/getGameName.js";

export const gameHistoryHandler = async (gameType, limit) => {
  if (!gameType) {
    console.log("Game history frontend error");
    return;
  }

  try {
    // Find game config to get the game ID
    const gameConfig = await getGameConfig(gameType);
    if (!gameConfig) {
      throw new Error(`Game config not found for type: ${gameType}`);
    }

    console.log(gameConfig);

    // Fetch records from database
    const history = await db
      .select()
      .from(rounds)
      .where(eq(rounds.gameId, gameConfig.id))
      .orderBy(desc(rounds.createdAt))
      .limit(limit);

    // Format the response
    const formattedHistory = history.map((round) => ({
      gameName: gameConfig.gameType,
      roundId: round.roundId,
      winner: getWinner(round.winner, gameType),
    }));

    return formattedHistory.reverse();
  } catch (error) {
    console.error("Error in gameHistoryHandler:", error);
    return null;
  }
};

function getWinner(winner, gameType) {
  switch (gameType) {
    case GAME_TYPES.DRAGON_TIGER:
      return winner.includes("dragon")
        ? "D"
        : winner.includes("tiger")
        ? "T"
        : "T/P";
    case GAME_TYPES.DRAGON_TIGER_TWO:
      return winner.includes("dragon")
        ? "D"
        : winner.includes("tiger")
        ? "T"
        : "T/P";
    case GAME_TYPES.ANDAR_BAHAR:
      return "A/B";
    case GAME_TYPES.ANDAR_BAHAR_TWO:
      return winner.includes("andar") ? "A" : "B";
    case GAME_TYPES.LUCKY7B:
      return winner.includes("low")
        ? "L"
        : winner.includes("high")
        ? "H"
        : winner.includes("mid")
        ? "M"
        : null;
    case GAME_TYPES.LUCKY7A:
      return winner.includes("low")
        ? "L"
        : winner.includes("high")
        ? "H"
        : winner.includes("mid")
        ? "M"
        : null;
    case GAME_TYPES.TEEN_PATTI:
      return winner.includes("playerA") ? "A" : "B";
    case GAME_TYPES.DRAGON_TIGER_LION:
      return winner.includes("dragon")
        ? "D"
        : winner.includes("tiger")
        ? "T"
        : "L";

    default:
      return winner;
  }
}
