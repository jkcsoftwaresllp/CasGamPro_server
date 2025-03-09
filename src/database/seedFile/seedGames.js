import { db } from "../../config/db.js";
import { gamesDataByCategory } from "../../data/gamesDataByCategory.js";
import { gameConfigData } from "../../data/gameConfigData.js";
import { betSides, multipliers, games } from "../../database/schema.js";
import { eq, and } from "drizzle-orm";

export const seedGames = async (logger) => {
  logger.info("Seeding game configurations...");

  try {
    await db.transaction(async (trx) => {
      const combinedGames = [gamesDataByCategory];

      console.log(combinedGames);

      for (const game of combinedGames) {
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
            set: {
              name: game.name,
              gameId: game.gameId,
              description: game.description,
              bettingDuration: game.bettingDuration,
              cardDealInterval: game.cardDealInterval,
            },
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
        const gameTypeId =
          "gameTypeId" in game ? game.gameTypeId : game.gameType;

        console.log("game ---------------");

        if (game.betSides && game.betSides.length > 0) {
          const betSideIds = {};
          console.log("game1 ---------------");

          for (const betSide of game.betSides) {
            await trx
              .insert(betSides)
              .values({ gameId, gameTypeId, betSide }) // Added gameTypeId column
              .onDuplicateKeyUpdate({ set: { betSide, gameTypeId } });

            const [betSideRecord] = await trx
              .select({ id: betSides.id })
              .from(betSides)
              .where(
                and(
                  eq(betSides.gameId, gameId),
                  eq(betSides.betSide, betSide),
                  eq(betSides.gameTypeId, gameTypeId) // Ensure filtering by gameTypeId
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

        console.log("game5 ---------------");
      }
    });

    logger.info("Game configurations seeded successfully!");
  } catch (error) {
    logger.error("Error seeding game configurations:", error);
  }
};
