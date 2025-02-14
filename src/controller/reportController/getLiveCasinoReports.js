import { db } from "../../config/db.js";
import { rounds, games, bets, players } from "../../database/schema.js";
import { sql, eq, and, desc } from "drizzle-orm";
import { format, parse } from "date-fns";
import { logger } from "../../logger/logger.js";
import { filterUtils } from "../../utils/filterUtils.js";

export const getLiveCasinoReports = async (req, res) => {
  try {
    const { limit = 30, offset = 0 } = req.query;

    // Ensure valid numeric limit and offset
    const recordsLimit = Math.min(parseInt(limit) || 30, 100);
    const recordsOffset = parseInt(offset) || 0;

    // Get conditions from filterUtils
    const conditions = filterUtils(req.query);

    // Fetch data with filtering and pagination
    const results = await db
      .select({
        title: sql`CONCAT(${games.name}, ' Round ', ${rounds.id})`,
        date: sql`DATE_FORMAT(${rounds.createdAt}, '%d-%m-%Y')`,
        declare: sql`CASE WHEN ${rounds.winner} IS NOT NULL THEN true ELSE false END`,
        profitLoss: sql`
          CASE 
            WHEN ${bets.win} = true THEN ${bets.betAmount} 
            WHEN ${bets.win} = false THEN -${bets.betAmount} 
            ELSE 0 
          END
        `,
        playerUserId: players.userId,
      })
      .from(rounds)
      .innerJoin(games, eq(rounds.gameId, games.id))
      .innerJoin(bets, eq(bets.roundId, rounds.id))
      .innerJoin(players, eq(players.id, bets.playerId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(rounds.createdAt))
      .limit(recordsLimit)
      .offset(recordsOffset);

    // Fetch total records count
    const [totalCount] = await db
      .select({ count: sql`COUNT(*)` })
      .from(rounds)
      .innerJoin(games, eq(rounds.gameId, games.id))
      .innerJoin(bets, eq(bets.roundId, rounds.id))
      .innerJoin(players, eq(players.id, bets.playerId))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Calculate next offset
    const nextOffset =
      recordsOffset + recordsLimit < totalCount.count
        ? recordsOffset + recordsLimit
        : null;

    return res.status(200).json({
      uniqueCode: "CGP0081",
      message: "Live casino reports fetched successfully",
      data: {
        data: results,
        totalRecords: totalCount.count,
        nextOffset,
      },
    });
  } catch (error) {
    logger.error("Error fetching live casino reports:", error);
    return res.status(500).json({
      uniqueCode: "CGP0082",
      message: "Error fetching live casino reports",
      data: { error: error.message },
    });
  }
};
