import { db } from "../config/db.js";
import {
  users,
  rounds,
  bets,
  players,
  agents,
  superAgents,
} from "../database/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";
import { filterDateUtils } from "../utils/filterUtils.js";
import { logger } from "../logger/logger.js";
import { getGameName } from "../utils/getGameName.js";
import { formatDate } from "../utils/formatDate.js";

export const getProfitLoss = async (req, res) => {
  try {
    const { limit = 30, offset = 0, startDate, endDate } = req.query;
    const userId = req.session.userId;

    // Validate and set limit/offset
    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    // Fetch user role
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({
        uniqueCode: "CGP0093",
        message: "User not found",
        data: {},
      });
    }

    let profitLossData = [];

    if (user.role === "AGENT") {
      const [agent] = await db
        .select({ id: agents.id, commission: agents.maxCasinoCommission })
        .from(agents)
        .where(eq(agents.userId, userId));

      if (!agent) {
        return res.status(403).json({
          uniqueCode: "CGP0094",
          message: "Not authorized as agent",
          data: {},
        });
      }

      const playersList = await db
        .select({ id: players.id })
        .from(players)
        .where(eq(players.agentId, agent.id));

      if (playersList.length === 0) {
        return res.status(200).json({
          uniqueCode: "CGP0095",
          message: "No players found for this agent",
          data: [],
        });
      }

      const playerIds = playersList.map((p) => p.id);

      // Fetch profit/loss data for all players
      let agentData = await db
        .select({
          date: rounds.createdAt,
          roundId: rounds.roundId,
          gameId: rounds.gameId,
          roundEarning: sql`
            COALESCE(
              SUM(${bets.betAmount}) - SUM(CASE WHEN ${bets.win} = true THEN ${bets.betAmount} ELSE 0 END), 
              0
            )
          `,
          commissionEarning: sql`
            COALESCE(SUM(${bets.betAmount} * ${agent.commission} / 100), 0)
          `,
          totalEarning: sql`
            COALESCE(
              SUM(${bets.betAmount}) - SUM(CASE WHEN ${bets.win} = true THEN ${bets.betAmount} ELSE 0 END) + 
              SUM(${bets.betAmount} * ${agent.commission} / 100),
              0
            )
          `,
        })
        .from(rounds)
        .leftJoin(bets, eq(bets.roundId, rounds.roundId))
        .leftJoin(players, eq(players.id, bets.playerId))
        .where(sql`${bets.playerId} IN (${playerIds.join(",")})`)
        .groupBy(rounds.roundId)
        .orderBy(desc(rounds.createdAt));

      // Apply filtering after fetching data
      agentData = filterDateUtils({ data: agentData, startDate, endDate });

      if (agentData.length > 0) {
        profitLossData = await Promise.all(
          agentData.map(async (row) => ({
            date: formatDate(row.date),
            roundId: row.roundId.toString(),
            roundTitle: await getGameName(row.gameId),
            roundEarning: parseFloat(row.roundEarning),
            commissionEarning: parseFloat(row.commissionEarning),
            totalEarning: parseFloat(row.totalEarning),
          }))
        );
      }
    } else if (user.role === "SUPERAGENT") {
      const [superAgent] = await db
        .select({
          id: superAgents.id,
          commission: superAgents.maxCasinoCommission,
        })
        .from(superAgents)
        .where(eq(superAgents.userId, userId));

      if (!superAgent) {
        return res.status(403).json({
          uniqueCode: "CGP0096",
          message: "Not authorized as super agent",
          data: {},
        });
      }

      const agentsList = await db
        .select({
          id: agents.id,
          name: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          commission: agents.maxCasinoCommission,
        })
        .from(agents)
        .innerJoin(users, eq(agents.userId, users.id))
        .where(eq(agents.superAgentId, superAgent.id));

      if (agentsList.length === 0) {
        return res.status(200).json({
          uniqueCode: "CGP0097",
          message: "No agents found for this super agent",
          data: [],
        });
      }

      for (const agent of agentsList) {
        let agentData = await db
          .select({
            date: rounds.createdAt,
            roundId: rounds.roundId,
            gameId: rounds.gameId,
            roundEarning: sql`
              COALESCE(
                SUM(${bets.betAmount}) - SUM(CASE WHEN ${bets.win} = true THEN ${bets.betAmount} ELSE 0 END), 
                0
              )
            `,
            commissionEarning: sql`
              COALESCE(SUM(${bets.betAmount} * ${agent.commission} / 100), 0)
            `,
            totalEarning: sql`
              COALESCE(
                SUM(${bets.betAmount}) - SUM(CASE WHEN ${bets.win} = true THEN ${bets.betAmount} ELSE 0 END) + 
                SUM(${bets.betAmount} * ${agent.commission} / 100),
                0
              )
            `,
          })
          .from(rounds)
          .leftJoin(bets, eq(bets.roundId, rounds.roundId))
          .leftJoin(players, eq(players.id, bets.playerId))
          .where(eq(players.agentId, agent.id))
          .groupBy(rounds.roundId)
          .orderBy(desc(rounds.createdAt));

        // Apply filtering after fetching data
        agentData = filterDateUtils({ data: agentData, startDate, endDate });

        if (agentData.length > 0) {
          const data = await Promise.all(
            agentData.map(async (row) => ({
              date: formatDate(row.date),
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
    } else {
      return res.status(403).json({
        uniqueCode: "CGP0098",
        message: "Unauthorized role",
        data: {},
      });
    }
    profitLossData = profitLossData
      .slice(recordsOffset, recordsOffset + recordsLimit);

    return res.status(200).json({
      uniqueCode: "CGP0099",
      message: "Profit/loss data fetched successfully",
      data: { results: profitLossData },
    });
  } catch (error) {
    logger.error("Error fetching profit/loss data:", error);
    return res.status(500).json({
      uniqueCode: "CGP0100",
      message: "Internal server error",
      data: {},
    });
  }
};
