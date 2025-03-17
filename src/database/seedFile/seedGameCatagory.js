import { db } from "../../config/db.js";
import { gamesListData } from "../../data/gamesListData.js";
import { game_categories } from "../schema.js";
import { logger } from "../../logger/logger.js";

export const seedGameCategories = async () => {
  logger.info("Seeding game_categories table...");

  try {
    await db.transaction(async (trx) => {
      for (const game of gamesListData) {
        await trx.insert(game_categories).values({
          id: game.id,
          name: game.name,
          description: game.description,
          thumbnail: game.thumbnail,
        });
      }
    });

    logger.info("Successfully seeded game_categories.");
  } catch (error) {
    logger.error("Error seeding game_categories:", error);
  }
};
