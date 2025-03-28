import { GAME_TYPES } from "../../services/shared/config/types.js";
import { getGameConfig } from "../../database/queries/games/sqlTypes.js";
import { eq, desc } from "drizzle-orm";
import { db } from "../../config/db.js";
import { game_rounds } from "../../database/schema.js";

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

    // Fetch records from database
    const history = await db
      .select()
      .from(game_rounds)
      .where(eq(game_rounds.game_id, gameConfig.gameId))
      .orderBy(desc(game_rounds.created_at))
      .limit(limit);

    // Format the response
    const formattedHistory = history
      .filter((round) => {
        return round.winner !== null;
      })
      .map((round) => ({
        gameName: gameConfig.gameType,
        roundId: round.id,
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
      return winner.includes("ander") ? "A" : "B";
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
