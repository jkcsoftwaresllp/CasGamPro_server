import { db } from "../../config/db.js";
import { casinoGamesData } from "../../data/gamesDataByCategory.js";
import { game_bet_sides, games } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { GAME_CONFIGS } from "../../services/shared/config/types.js";

export const seedGames = async () => {
  logger.info("Seeding game configurations...");

  try {
    await db.transaction(async (trx) => {
      for (const game of casinoGamesData) {
        const existingGame = await trx
          .select()
          .from(games)
          .where(eq(games.gameType, game.gameType));

        // Skip if the game already exists
        if (existingGame.length) {
          logger.info(`Skipping already seeded game: ${game.name}`);
          continue;
        }

        // Insert new game
        await trx.insert(games).values({
          id: game.gameId, // UUID
          category_id: game.categoryId, // Foreign Key
          gameType: game.gameType,
          name: game.name,
          description: game.description || "This is a casino game.",
          thumbnail: game.thumbnail || "url_of_thumbnail",
          betting_duration: game.bettingDuration || 20000,
          card_deal_interval: game.cardDealInterval || 3000,
        });

        logger.info(`Game Seeded: ${game.name}`);
      }
    });

    logger.info("All games seeded successfully.");
  } catch (error) {
    logger.error("Error seeding games:", error);
    throw error;
  }
};

export const seedGameBetSides = async () => {
  logger.info("Seeding game_bet_sides data...");

  try {
    await db.transaction(async (trx) => {
      for (const config of Object.values(GAME_CONFIGS)) {
        const { id: gameId, betSides, multipliers } = config;

        //  Insert each bet side with its multiplier
        for (const betSide of betSides) {
          await trx.insert(game_bet_sides).values({
            game_id: gameId,
            bet_side: betSide,
            multiplier: multipliers[betSide],
          });
        }
      }
    });

    logger.info("Successfully seeded game_bet_sides data.");
  } catch (error) {
    logger.error("Error while seeding game_bet_sides:", error);
  }
};
