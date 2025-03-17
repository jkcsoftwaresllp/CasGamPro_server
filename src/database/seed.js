import {
  seedGameBetSides,
  seedGameCategories,
  seedGames,
  seedRules,
  seedUsers,
} from "../database/seedFile/index.js";
import { logger } from "../logger/logger.js";

export const seed = async () => {
  try {
    logger.info("Seeding database...");

    await seedUsers();
    await seedGameCategories();
    await seedGames();
    await seedGameBetSides();
    await seedRules();

    logger.info("Seeding completed successfully!");
  } catch (error) {
    logger.error("Error seeding database:", error);
  }
};
