import {
  seedGameBetSides,
  seedGames,
  seedUsers,
} from "../database/seedFile/index.js";
import { logger } from "../logger/logger.js";

const seed = async () => {
  try {
    logger.info("Seeding database...");

    await seedUsers();
    await seedGames();
    await seedGameBetSides();

    logger.info("Seeding completed successfully!");
  } catch (error) {
    logger.error("Error seeding database:", error);
  }
};

seed().then(() => {
  process.exit(0);
});
