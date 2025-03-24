import { db } from "../../config/db.js";
import { rulesData } from "../../data/rulesData.js";
import { logger } from "../../logger/logger.js";
import { rules } from "../schema.js";

export const seedRules = async () => {
  logger.info("Seeding rules data...");

  await db
    .insert(rules)
    .values(rulesData)
    .onDuplicateKeyUpdate({
      set: {
        rule: rules.rule,
        language: rules.language,
      },
    });

  logger.info("Successfully seeded rules.");
};
