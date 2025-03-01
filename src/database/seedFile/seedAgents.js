import { db } from "../../config/db.js";
import { agents } from "../schema.js";
import { eq } from "drizzle-orm";

export const seedAgents = async (logger) => {
  logger.info("Seeding agents...");

  const agentList = [
    {
      userId: 2,
      superAgentId: 1,
      maxShare: 50.0,
      maxCasinoCommission: 5.0,
      maxLotteryCommission: 10.0,
      maxSessionCommission: 8.0,
      balance: 100000.0,
      limitValue: 2000.0,
    },
    {
      userId: 3,
      superAgentId: 1,
      maxShare: 40.0,
      maxCasinoCommission: 4.5,
      maxLotteryCommission: 9.0,
      maxSessionCommission: 7.5,
      balance: 100000.0,

      limitValue: 2000.0,
    },
    {
      userId: 4,
      superAgentId: 1,
      maxShare: 45.0,
      maxCasinoCommission: 5.5,
      maxLotteryCommission: 9.5,
      maxSessionCommission: 8.5,
      balance: 100000.0,

      limitValue: 2000.0,
    },
    {
      userId: 5,
      superAgentId: 1,
      maxShare: 48.0,
      maxCasinoCommission: 6.0,
      maxLotteryCommission: 10.5,
      maxSessionCommission: 9.0,
      balance: 100000.0,
      limitValue: 2000.0,
    },
  ];

  for (const agent of agentList) {
    await db
      .insert(agents)
      .values(agent)
      .onDuplicateKeyUpdate({
        set: {
          superAgentId: agent.superAgentId,
          maxShare: agent.maxShare,
          maxCasinoCommission: agent.maxCasinoCommission,
          maxLotteryCommission: agent.maxLotteryCommission,
          maxSessionCommission: agent.maxSessionCommission,
          balance: agent.balance,
          limitValue: agent.limitValue,
        },
      });
  }

  logger.info("Agents inserted successfully.");
};
