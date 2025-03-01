import { db } from "../../config/db.js";
import { superAgents } from "../schema.js";
import { eq } from "drizzle-orm";

export const seedSuperAgents = async (logger) => {
  logger.info("Seeding super agents...");

  const superAgentList = [
    { userId: 2, minBet: 10, maxBet: 1000 }, // Vivek as SUPERAGENT1
  ];

  for (const superAgent of superAgentList) {
    await db
      .insert(superAgents)
      .values(superAgent)
      .onDuplicateKeyUpdate({
        set: { minBet: superAgent.minBet, maxBet: superAgent.maxBet },
      });
  }

  logger.info("Super agents inserted successfully.");
};
