import { db } from "../../config/db.js";
import {
  rounds,
  bets,
  agents,
  superAgents,
  users,
} from "../../database/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";
import { filterUtils } from "../../utils/filterUtils.js";
import { logger } from "../../logger/logger.js";
import { getGameName } from "../../utils/getGameName.js";

export const getAgentProfitLoss = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const superAgentId = req.session.userId;

    // Validate super agent
    const [superAgent] = await db
      .select()
      .from(superAgents)
      .where(eq(superAgents.userId, superAgentId));

    if (!superAgent) {
      return res.status(403).json({
        uniqueCode: "CGP0199",
        message: "Not authorized as super agent",
        data: {},
      });
    }

    // Get all agents under this super agent
    const agentsList = await db
      .select({
        id: agents.id,
        name: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(agents)
      .innerJoin(users, eq(agents.userId, users.id))
      .where(eq(agents.superAgentId, superAgent.id));

    if (agentsList.length === 0) {
      return res.status(200).json({
        uniqueCode: "CGP0200",
        message: "No agents found for this super agent",
        data: [],
      });
    }

    // Generate filter conditions
    const conditions = filterUtils({ startDate, endDate });

    // Fetch profit/loss data for each agent
    const profitLossData = [];

    for (const agent of agentsList) {
      const agentData = await db
        .select({
          date: sql`DATE_FORMAT(${rounds.createdAt}, '%d-%m-%Y')`,
          roundId: rounds.roundId,
          gameId: rounds.gameId,
          roundEarning: sql`
            COALESCE(
              SUM(${bets.betAmount}) - SUM(CASE WHEN ${bets.win} = true THEN ${bets.betAmount} ELSE 0 END), 
              0
            )
          `,
          commissionEarning: sql`
            COALESCE(SUM(${bets.betAmount} * ${agents.maxCasinoCommission} / 100), 0)
          `,
          totalEarning: sql`
            COALESCE(
              SUM(${bets.betAmount}) - SUM(CASE WHEN ${bets.win} = true THEN ${bets.betAmount} ELSE 0 END) + 
              SUM(${bets.betAmount} * ${agents.maxCasinoCommission} / 100),
              0
            )
          `,
        })
        .from(rounds)
        .leftJoin(bets, eq(bets.roundId, rounds.roundId))
        .leftJoin(agents, eq(agents.id, agent.id))
        .where(and(...conditions))
        .groupBy(rounds.roundId)
        .orderBy(desc(rounds.createdAt));

      if (agentData.length > 0) {
        const data = await Promise.all(
          agentData.map(async (row) => ({
            date: row.date,
            roundId: row.roundId.toString(),
            roundTitle: await getGameName(row.gameId),
            roundEarning: parseFloat(row.roundEarning),
            commissionEarning: parseFloat(row.commissionEarning),
            totalEarning: parseFloat(row.totalEarning),
          }))
        );

        profitLossData.push({
          agentId: agent.id,
          agentName: agent.name,
          data,
        });
      }
    }

    return res.status(200).json({
      uniqueCode: "CGP0201",
      message: "Agent profit/loss data fetched successfully",
      data: { results: profitLossData },
    });
  } catch (error) {
    logger.error("Error fetching agent profit/loss data:", error);
    return res.status(500).json({
      uniqueCode: "CGP0202",
      message: "Internal server error",
      data: {},
    });
  }
};
