import { db } from "../../config/db.js";
import { gamesDataByCategory } from "../../data/gamesDataByCategory.js";
import { betSides, multipliers, games } from "../../database/schema.js";
import { eq, and } from "drizzle-orm";

export const seedGames = async (logger) => {
  logger.info("Seeding game configurations...");

  try {
    await db.transaction(async (trx) => {
      const combinedGames = [...gamesDataByCategory]; // Fix incorrect structure

      for (const game of combinedGames) {
        // Skip invalid game entries
        if (!game.gameType || !game.gameId || !game.name) {
          logger.warn(`Skipping invalid game entry: ${JSON.stringify(game)}`);
          continue;
        }

        try {
          await trx
            .insert(games)
            .values({
              gameType: game.gameType,
              gameId: game.gameId,
              name: game.name,
              description: game.description,
              categoryId: game.categoryId || 1,
              thumbnail: game.thumbnail,
              bettingDuration: game.bettingDuration,
              cardDealInterval: game.cardDealInterval,
            })
            .onDuplicateKeyUpdate({
              set: Object.fromEntries(
                Object.entries({
                  name: game.name,
                  description: game.description,
                  bettingDuration: game.bettingDuration,
                  cardDealInterval: game.cardDealInterval,
                }).filter(([_, v]) => v !== undefined) // Remove undefined values
              ),
            });

          const [gameRecord] = await trx
            .select({ id: games.id })
            .from(games)
            .where(eq(games.gameType, game.gameType));

          if (!gameRecord) {
            throw new Error(
              `Game record not found for gameType: ${game.gameType}`
            );
          }

          const gameId = gameRecord.id;
          const gameTypeId = game.gameTypeId || game.gameType;

          if (game.betSides && game.betSides.length > 0) {
            const betSideIds = {};

            for (const betSide of game.betSides) {
              await trx
                .insert(betSides)
                .values({ gameId, gameTypeId, betSide })
                .onDuplicateKeyUpdate({ set: { betSide, gameTypeId } });

              const [betSideRecord] = await trx
                .select({ id: betSides.id })
                .from(betSides)
                .where(
                  and(
                    eq(betSides.gameId, gameId),
                    eq(betSides.betSide, betSide),
                    eq(betSides.gameTypeId, gameTypeId)
                  )
                );

              if (!betSideRecord) {
                throw new Error(
                  `Bet side not found for gameId: ${gameId}, betSide: ${betSide}, gameTypeId: ${gameTypeId}`
                );
              }

              betSideIds[betSide] = betSideRecord.id;
            }

            if (game.multipliers) {
              for (const betSide in game.multipliers) {
                const betSideId = betSideIds[betSide];
                if (!betSideId) {
                  logger.warn(
                    `Skipping multiplier for unknown betSide: ${betSide}`
                  );
                  continue;
                }

                await trx
                  .insert(multipliers)
                  .values({
                    gameId,
                    betSideId,
                    multiplier: game.multipliers[betSide],
                  })
                  .onDuplicateKeyUpdate({
                    set: { multiplier: game.multipliers[betSide] },
                  });
              }
            }
          }
        } catch (gameError) {
          logger.error(`Error processing game ${game.gameId}:`, gameError);
        }
      }
    });

    logger.info("Game configurations seeded successfully!");
  } catch (error) {
    logger.error("Error seeding game configurations:", error);
  }
};
