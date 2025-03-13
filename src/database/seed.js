import { db } from "../config/db.js";
import { eq } from "drizzle-orm";
import { seedUsers } from "../database/seedFile/seedUsers.js";

const seed = async () => {
  try {
    logger.info("Seeding database...");

    await seedUsers();
    logger.info("Users seeded successfully.");

    logger.info("Seeding completed successfully!");
  } catch (error) {
    logger.error("Error seeding database:", error);
  }
};

seed().then(() => {
  process.exit(0);
});
