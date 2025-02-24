import { db } from "../config/db.js";
import { rounds, bets, players, agents, games } from "../database/schema.js";
import { eq, and, sql, desc, gte, lte } from "drizzle-orm";
import { formatDateForMySQL } from "../utils/dateUtils.js";
import { logger } from "../logger/logger.js";

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

    if (!agentPlayers.length) {
      return res.status(200).json({
        uniqueCode: "CGP0094",
        message: "No players found for this agent",
        data: [],
      });
    }

    const playerIds = agentPlayers.map((p) => p.id);

    // Build date conditions
    let dateConditions = [];
    if (startDate) {
      dateConditions.push(
        gte(
          rounds.createdAt,
          sql`CAST(${formatDateForMySQL(startDate)} AS DATETIME)`
        )
      );
    }
    if (endDate) {
      dateConditions.push(
        lte(
          rounds.createdAt,
          sql`CAST(${formatDateForMySQL(endDate).replace(
            "00:00:00",
            "23:59:59"
          )} AS DATETIME)`
        )
      );
    }

    // Get profit/loss data
    const profitLossData = await db
      .select({
        date: sql`DATE_FORMAT(${rounds.createdAt}, '%d-%m-%Y')`,
        roundId: rounds.id,
        roundTitle: games.name,
        roundEarning: sql`COALESCE(SUM(${bets.betAmount}) - SUM(CASE WHEN ${bets.win} = true THEN ${bets.betAmount} ELSE 0 END), 0)`,
        commissionEarning: sql`COALESCE(SUM(${bets.betAmount} * ${agent.maxCasinoCommission} / 100), 0)`,
        totalEarning: sql`COALESCE(SUM(${bets.betAmount}) - SUM(CASE WHEN ${bets.win} = true THEN ${bets.betAmount} ELSE 0 END) + SUM(${bets.betAmount} * ${agent.maxCasinoCommission} / 100), 0)`,
      })
      .from(rounds)
      .innerJoin(games, eq(games.id, rounds.gameId))
      .leftJoin(bets, eq(bets.roundId, rounds.id))
      .where(
        and(
          sql`${bets.playerId} IN (${playerIds.join(",")})`,
          ...dateConditions
        )
      )
      .groupBy(rounds.id, games.name)
      .orderBy(desc(rounds.createdAt));

    const formattedData = profitLossData.map((row) => ({
      date: row.date,
      roundId: row.roundId.toString(),
      roundTitle: row.roundTitle,
      roundEarning: parseFloat(row.roundEarning),
      commissionEarning: parseFloat(row.commissionEarning),
      totalEarning: parseFloat(row.totalEarning),
    }));

    return res.status(200).json({
      uniqueCode: "CGP0095",
      message: "Profit/Loss data fetched successfully",
      data: {results: formattedData},
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
