import { db } from '../../config/db.js';
import { categories, games } from '../../database/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../../logger/logger.js';
import SocketManager from '../../services/shared/config/socket-manager.js';

export const gameBlock = async (req, res) => {
  try {
    const { id, type } = req.body;

    if (!id || !type) {
      return res.status(400).json({
        uniqueCode: 'CGP0150',
        message: 'ID and type are required',
        data: {},
      });
    }

    if (!['category', 'game'].includes(type)) {
      return res.status(400).json({
        uniqueCode: 'CGP0151',
        message: 'Invalid type. Must be either "category" or "game"',
        data: {},
      });
    }

    let result;
    let currentStatus;

    if (type === 'category') {
      // Get current status first
      const [category] = await db
        .select({ blocked: categories.blocked })
        .from(categories)
        .where(eq(categories.id, id));

      if (!category) {
        return res.status(404).json({
          uniqueCode: 'CGP0152',
          message: 'Category not found',
          data: {},
        });
      }

      currentStatus = category.blocked;

      // Toggle category status
      result = await db
        .update(categories)
        .set({ blocked: !currentStatus })
        .where(eq(categories.id, id));

      // Also block/unblock all games in this category
      await db
        .update(games)
        .set({ blocked: !currentStatus })
        .where(eq(games.categoryId, id));

    } else {
      // Get current status first
      const [game] = await db
        .select({ blocked: games.blocked })
        .from(games)
        .where(eq(games.id, id));

      if (!game) {
        return res.status(404).json({
          uniqueCode: 'CGP0153',
          message: 'Game not found',
          data: {},
        });
      }

      currentStatus = game.blocked;

      // Toggle game status
      result = await db
        .update(games)
        .set({ blocked: !currentStatus })
        .where(eq(games.id, id));
    }

    // Emit socket event to notify clients
    SocketManager.io?.emit('gameStatusUpdate', {
      id,
      type,
      blocked: !currentStatus,
    });

    return res.status(200).json({
      uniqueCode: 'CGP0154',
      message: `${type === 'category' ? 'Category' : 'Game'} ${currentStatus ? 'unblocked' : 'blocked'} successfully`,
      data: {
        id,
        type,
        blocked: !currentStatus,
      },
    });

  } catch (error) {
    logger.error('Error toggling game block:', error);
    return res.status(500).json({
      uniqueCode: 'CGP0155',
      message: 'Internal server error',
      data: { error: error.message },
    });
  }
};

export const getBlockedGames = async (req, res) => {
  try {
    const { categoryId } = req.query;

    let query = db
      .select({
        id: games.id,
        name: games.name,
        blocked: games.blocked,
        categoryId: games.categoryId,
        categoryName: categories.name,
      })
      .from(games)
      .innerJoin(categories, eq(games.categoryId, categories.id));

    if (categoryId) {
      query = query.where(eq(games.categoryId, categoryId));
    }

    const results = await query;

    return res.status(200).json({
      uniqueCode: 'CGP0156',
      message: 'Games fetched successfully',
      data: { results },
    });

  } catch (error) {
    logger.error('Error fetching blocked games:', error);
    return res.status(500).json({
      uniqueCode: 'CGP0157',
      message: 'Internal server error',
      data: { error: error.message },
    });
  }
};