import { db } from "../../config/db.js";
import { agents } from "../schema.js";
import { eq } from "drizzle-orm";

export const seedAgents = async (logger) => {
  logger.info("Seeding agents...");

  const agentList = [
    { userId: 6, superAgentId: 1 }, // Danishan under SUPERAGENT1
    { userId: 7, superAgentId: 1 }, // Kinjalk under SUPERAGENT1
    { userId: 8, superAgentId: 1 }, // Abdullah under SUPERAGENT1
    { userId: 9, superAgentId: 1 }, // ROOT1 under SUPERAGENT1
  ];

  for (const agent of agentList) {
    await db
      .insert(agents)
      .values(agent)
      .onDuplicateKeyUpdate({
        set: { superAgentId: agent.superAgentId },
      });
  }

  logger.info("Agents inserted successfully.");
};
