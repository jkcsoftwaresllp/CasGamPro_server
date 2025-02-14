import { db } from "../../config/db.js";
import { agents } from "../schema.js";
import { eq } from "drizzle-orm";

export const seedAgents = async (logger) => {
  logger.info("Seeding agents...");

  const agentList = [
    {
      userId: 6,
      superAgentId: 1,
      maxShare: 50.0,
      maxCasinoCommission: 5.0,
      maxLotteryCommission: 10.0,
      maxSessionCommission: 8.0,
      fixLimit: 1000.0,
      balance: 5000.0,

      limitValue: 2000.0,
    },
    {
      userId: 7,
      superAgentId: 1,
      maxShare: 40.0,
      maxCasinoCommission: 4.5,
      maxLotteryCommission: 9.0,
      maxSessionCommission: 7.5,
      fixLimit: 900.0,
      balance: 4500.0,

      limitValue: 1800.0,
    },
    {
      userId: 8,
      superAgentId: 1,
      maxShare: 45.0,
      maxCasinoCommission: 5.5,
      maxLotteryCommission: 9.5,
      maxSessionCommission: 8.5,
      fixLimit: 1100.0,
      balance: 4800.0,

      limitValue: 1900.0,
    },
    {
      userId: 9,
      superAgentId: 1,
      maxShare: 48.0,
      maxCasinoCommission: 6.0,
      maxLotteryCommission: 10.5,
      maxSessionCommission: 9.0,
      fixLimit: 1200.0,
      balance: 5100.0,

      limitValue: 2100.0,
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
          fixLimit: agent.fixLimit,
          balance: agent.balance,
          limitValue: agent.limitValue,
        },
      });
  }

  logger.info("Agents inserted successfully.");
};
