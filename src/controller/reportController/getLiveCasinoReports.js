import { db } from '../../config/db.js';
import { rounds, games, bets } from '../../database/schema.js';
import { sql, eq, and, gte, lte, desc } from 'drizzle-orm';
import { format, parse } from 'date-fns';
import { logger } from '../../logger/logger.js';

export const getLiveCasinoReports = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      userId,
      clientName,
      limit = 30,
      offset = 0
    } = req.query;

    // Ensure valid numeric limit and offset
    const recordsLimit = Math.min(parseInt(limit) || 30, 100);
    const recordsOffset = parseInt(offset) || 0;

    // Construct filtering conditions
    let conditions = [];

    // Date filtering (default: last 30 records if no dates provided)
    if (startDate) {
      const parsedStartDate = parse(startDate, 'dd-MM-yyyy', new Date());
      conditions.push(gte(rounds.createdAt, sql`CAST(${format(parsedStartDate, 'yyyy-MM-dd')} AS DATE)`));
    }

    if (endDate) {
      const parsedEndDate = parse(endDate, 'dd-MM-yyyy', new Date());
      conditions.push(lte(rounds.createdAt, sql`CAST(${format(parsedEndDate, 'yyyy-MM-dd')} AS DATE)`));
    }

    // User filtering
    if (userId) {
      conditions.push(eq(bets.playerId, userId));
    }

    if (clientName) {
      conditions.push(eq(bets.playerName, clientName));
    }

    // Fetch data with filtering and pagination
    const results = await db
      .select({
        title: sql`CONCAT(${games.name}, ' Round ', ${rounds.id})`,
        date: sql`DATE_FORMAT(${rounds.createdAt}, '%d-%m-%Y')`,
        declare: sql`CASE WHEN ${rounds.winner} IS NOT NULL THEN true ELSE false END`,
        profitLoss: sql`CASE 
          WHEN ${bets.win} = true THEN CONCAT('+', ${bets.betAmount})
          ELSE CONCAT('-', ${bets.betAmount})
        END`
      })
      .from(rounds)
      .innerJoin(games, eq(rounds.gameId, games.id))
      .innerJoin(bets, eq(bets.roundId, rounds.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(rounds.createdAt))
      .limit(recordsLimit)
      .offset(recordsOffset);

    // Fetch total records count
    const [totalCount] = await db
      .select({
        count: sql`COUNT(*)`
      })
      .from(rounds)
      .innerJoin(games, eq(rounds.gameId, games.id))
      .innerJoin(bets, eq(bets.roundId, rounds.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Calculate next offset
    const nextOffset = recordsOffset + recordsLimit < totalCount.count 
      ? recordsOffset + recordsLimit 
      : null;

    return res.status(200).json({
      uniqueCode: 'CGP0081',
      message: 'Live casino reports fetched successfully',
      data: {
        data: results,
        totalRecords: totalCount.count,
        nextOffset
      }
    });

  } catch (error) {
    logger.error('Error fetching live casino reports:', error);
    return res.status(500).json({
      uniqueCode: 'CGP0082',
      message: 'Error fetching live casino reports',
      data: { error: error.message }
    });
  }
};