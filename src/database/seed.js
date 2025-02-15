import { db } from "../config/db.js";
import { categories, games, rules } from "./schema.js";
import { eq } from "drizzle-orm";
import { rulesData } from "../data/rulesData.js";
import { logger } from "../logger/logger.js";
import { gamesListData } from "../data/gamesListData.js";
import { gamesDataByCategory } from "../data/gamesDataByCategory.js";
import { seedUsers } from "./seedFile/seedUsers.js";
import { seedAgents } from "./seedFile/seedAgents.js";
import { seedSuperAgents } from "./seedFile/seedSuperAgents.js";
import { seedPlayers } from "./seedFile/seedPlayers.js";

const seed = async () => {
  try {
    logger.info("Seeding database...");

    await seedUsers(logger);
    await seedSuperAgents(logger);
    await seedAgents(logger);
    await seedPlayers(logger);

    // Insert categories
    await db.insert(categories).values(gamesListData);
    logger.info("Categories inserted successfully.");

    // Insert games
    await db.insert(games).values(gamesDataByCategory);
    logger.info("Games inserted successfully.");

    // Insert rules
    for (const rule of rulesData) {
      await db
        .insert(rules)
        .values(rule)
        .onDuplicateKeyUpdate({
          set: { type: rule.type, rule: rule.rule },
        });
    }

    logger.info("Rules inserted successfully.");
    logger.info("Seeding completed successfully!");
    logger.info("Enter Ctrl+C to exit.\n");
  } catch (error) {
    logger.error("Error seeding database:", error);
  }
};

seed();
