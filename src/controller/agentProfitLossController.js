import { db } from "../config/db.js";
import { rounds, bets, players, agents, users } from "../database/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";
import { filterUtils } from "../utils/filterUtils.js";
import { logger } from "../logger/logger.js";
import { getGameName } from "../utils/getGameName.js";
import { formatDate } from "../utils/formatDate.js";

export const getProfitLoss = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const agentId = req.session.userId;

    // Validate agent
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, agentId));

    if (!agent) {
      return res.status(403).json({
        uniqueCode: "CGP0093",
        message: "Not authorized as agent",
        data: {},
      });
    }

    // Get all players under this agent
    const agentPlayers = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.agentId, agent.id));

    if (agentPlayers.length === 0) {
      return res.status(200).json({
        uniqueCode: "CGP0094",
        message: "No players found for this agent",
        data: [],
      });
    }

    const playerIds = agentPlayers.map((p) => p.id);

    // Generate filter conditions
    const conditions = filterUtils({ startDate, endDate, playerIds });

    // Fetch profit/loss data
    const profitLossData = await db
      .select({
        date: sql`DATE_FORMAT(${rounds.createdAt}, '%d-%m-%Y')`,
        roundId: rounds.roundId,
        gameId: rounds.gameId, // Fetch gameId for mapping
        roundEarning: sql`
          COALESCE(
            SUM(${bets.betAmount}) - SUM(CASE WHEN ${bets.win} = true THEN ${bets.betAmount} ELSE 0 END), 
            0
          )
        `,
        commissionEarning: sql`
          COALESCE(SUM(${bets.betAmount} * ${agent.maxCasinoCommission} / 100), 0)
        `,
        totalEarning: sql`
          COALESCE(
            SUM(${bets.betAmount}) - SUM(CASE WHEN ${bets.win} = true THEN ${bets.betAmount} ELSE 0 END) + 
            SUM(${bets.betAmount} * ${agent.maxCasinoCommission} / 100),
            0
          )
        `,
      })
      .from(rounds)
      .leftJoin(bets, eq(bets.roundId, rounds.roundId))
      .leftJoin(players, eq(players.id, bets.playerId))
      .leftJoin(users, eq(users.id, players.agentId))
      .where(and(...conditions))
      .groupBy(rounds.roundId)
      .orderBy(desc(rounds.createdAt));

    // Map gameId to game name
    const formattedData = profitLossData.map((row) => ({
      date: formatDate(row.date),
      roundId: row.roundId.toString(),
      roundTitle: getGameName(row.gameId),
      roundEarning: parseFloat(row.roundEarning),
      commissionEarning: parseFloat(row.commissionEarning),
      totalEarning: parseFloat(row.totalEarning),
    }));

    return res.status(200).json({
      uniqueCode: "CGP0095",
      message: "Profit/Loss data fetched successfully",
      data: { results: formattedData },
    });
  } catch (error) {
    logger.error("Error fetching profit/loss data:", error);
    return res.status(500).json({
      uniqueCode: "CGP0096",
      message: "Internal server error",
      data: {},
    });
  }
};
