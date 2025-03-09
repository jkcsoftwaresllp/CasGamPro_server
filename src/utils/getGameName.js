import { eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { games } from "../database/schema.js";

// Function to get game name from gameConfigData
export const getGameName = async (gameTypeId) => {
  let result = await db
    .select({ name: games.name })
    .from(games)
    .where(eq(games.id, gameTypeId)); //  find out from sql Id (int)

  if (result.length === 0) {
    result = await db
      .select({ name: games.name })
      .from(games)
      .where(eq(games.gameId, gameTypeId)); //  find out from gameId (varchar)
  }

  return result[0]?.name;
};
