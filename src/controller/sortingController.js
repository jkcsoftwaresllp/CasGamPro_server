import { db } from '../config/db.js';
import { logger } from '../logger/logger.js';
import { eq, like, and } from 'drizzle-orm';
import { games, game_rounds, game_bets } from '../database/schema.js';
import { createResponse } from '../helper/responseHelper.js';
import { getPaginationParams } from '../utils/paginationUtils.js';

export const fetchFilteredData = async (req, res) => {
  const {
    date,
    gameName,
    userId,
    username,
    gameType,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    page = 1,
    pageSize = 10,
  } = req.query;

  try {
    const { limit, offset } = getPaginationParams(pageSize, (page - 1) * pageSize);

    // Build filters
    const filters = [];
    if (date) filters.push(eq(game_rounds.created_at, new Date(date)));
    if (gameName) filters.push(like(games.name, `%${gameName}%`));
    if (gameType) filters.push(eq(games.gameType, gameType));
    if (userId) filters.push(eq(game_bets.user_id, userId));

    // Build query
    const data = await db
      .select({
        gameId: games.id,
        gameName: games.name,
        gameType: games.gameType,
        roundId: game_rounds.id,
        createdAt: game_rounds.created_at,
        betAmount: game_bets.bet_amount,
        winAmount: game_bets.win_amount,
      })
      .from(games)
      .leftJoin(game_rounds, eq(games.id, game_rounds.game_id))
      .leftJoin(game_bets, eq(game_rounds.id, game_bets.round_id))
      .where(and(...filters))
      .orderBy(sortOrder === 'ASC' ? games[sortBy] : games[sortBy].desc())
      .limit(limit)
      .offset(offset);

    return res.status(200).json(
      createResponse('success', 'CGP0039', 'Filtered data fetched successfully', {
        results: data,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: data.length,
        },
      })
    );
  } catch (error) {
    logger.error('Error fetching filtered data:', error);
    return res.status(500).json(
      createResponse('error', 'CGP0040', 'Internal Server Error')
    );
  }
};