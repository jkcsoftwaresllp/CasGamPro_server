import { eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { games } from "../database/schema.js";

// Function to get game name from gameConfigData
export const getGameName = async (gameTypeId) => {
  return await db
    .select({ name: games.name })
    .from(games)
    .where(eq(games.id, gameTypeId));
};
