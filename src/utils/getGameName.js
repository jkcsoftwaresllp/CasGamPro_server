import { eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { games } from "../database/schema.js";

// Function to get game name from gameConfigData
export const getGameName = async (gameTypeId) => {
  if (!gameTypeId) {
    console.error("Invalid gameTypeId:", gameTypeId);
    return "Unknown Game";
  }

  const parsedGameTypeId = isNaN(gameTypeId) ? gameTypeId : Number(gameTypeId);

  let result = await db
    .select({ name: games.name })
    .from(games)
    .where(eq(games.id, parsedGameTypeId));

  if (result.length === 0) {
    result = await db
      .select({ name: games.name })
      .from(games)
      .where(eq(games.gameId, parsedGameTypeId));
  }

  return result.length > 0 ? result[0].name : "Unknown Game";
};
