import { db } from "../../config/db.js";
import { amount_distribution, game_rounds, games, game_categories, game_bets } from "../../database/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { format } from "date-fns";
import { logger } from "../../logger/logger.js";

// Get main casino summary
export const getLiveCasinoReports = async (req, res) => {
  try {
    const { limit = 30, offset = 0, startDate, endDate } = req.query;
    const userId = req.session.userId;
    const userRole = req.session.userRole;
    
    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    if (!userId) {
      return res.status(401).json({
        uniqueCode: "CGP0281",
        message: "Unauthorized access",
        data: {},
      });
    }

    // Build base filters
    let filters = eq(amount_distribution.user_id, userId);

    // Add date filters if provided
    if (startDate) {
      filters = and(filters, sql`DATE(${amount_distribution.created_at}) >= ${startDate}`);
    }
    if (endDate) {
      filters = and(filters, sql`DATE(${amount_distribution.created_at}) <= ${endDate}`);
    }

    // Fetch transactions with game details
    const transactions = await db
      .select({
        date: amount_distribution.created_at,
        gameId: game_rounds.game_id,
        categoryName: game_categories.name,
        betAmount: amount_distribution.bet_amount,
        keep: amount_distribution.keep,
        pass: amount_distribution.pass,
        commission: amount_distribution.commission,
      })
      .from(amount_distribution)
      .innerJoin(game_rounds, eq(amount_distribution.round_id, game_rounds.id))
      .innerJoin(games, eq(game_rounds.game_id, games.id))
      .innerJoin(game_categories, eq(games.category_id, game_categories.id))
      .where(filters)
      .orderBy(desc(amount_distribution.created_at))
      .limit(recordsLimit)
      .offset(recordsOffset);

    // Group results by category and date
    const groupedResults = transactions.reduce((acc, tx) => {
      const date = format(new Date(tx.date), "yyyy-MM-dd");
      const key = `${tx.categoryName}_${date}`;

      if (!acc[key]) {
        acc[key] = {
          title: tx.categoryName,
          date: date,
          betAmount: 0,
          profitLoss: 0,
          commission: 0,
        };
      }

      acc[key].betAmount += parseFloat(tx.betAmount) || 0;
      acc[key].profitLoss += parseFloat(tx.keep) || 0;
      acc[key].commission += parseFloat(tx.commission) || 0;

      return acc;
    }, {});

    // Convert to array and format
    const results = Object.values(groupedResults).map(result => ({
      ...result,
      profitLoss: result.profitLoss.toFixed(2),
      betAmount: result.betAmount.toFixed(2),
      commission: result.commission.toFixed(2),
    }));

    return res.status(200).json({
      uniqueCode: "CGP0284",
      message: "Live casino reports fetched successfully",
      data: { results },
    });

  } catch (error) {
    logger.error("Error fetching live casino reports:", error);
    return res.status(500).json({
      uniqueCode: "CGP0285",
      message: "Error fetching live casino reports",
      data: { error: error.message },
    });
  }
};

// Get detailed game reports for a specific casino category
export const getLiveCasinoGameReports = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { categoryName, date } = req.params;

    if (!userId || !categoryName || !date) {
      return res.status(400).json({
        uniqueCode: "CGP0286",
        message: "Missing required parameters",
        data: {},
      });
    }

    // Fetch transactions for specific category and date
    const transactions = await db
      .select({
        date: amount_distribution.created_at,
        gameId: games.id,
        gameName: games.name,
        betAmount: game_bets.bet_amount,
        keep: amount_distribution.keep,
        pass: amount_distribution.pass,
        commission: amount_distribution.commission,
      })
      .from(amount_distribution)
      .innerJoin(game_rounds, eq(amount_distribution.round_id, game_rounds.id))
      .innerJoin(games, eq(game_rounds.game_id, games.id))
      .innerJoin(game_categories, eq(games.category_id, game_categories.id))
      .innerJoin(game_bets, eq(amount_distribution.round_id, game_bets.round_id))
      .where(
        and(
          eq(amount_distribution.user_id, userId),
          eq(game_categories.name, categoryName),
          sql`DATE(${amount_distribution.created_at}) = ${date}`
        )
      );

    // Group by game
    const groupedResults = transactions.reduce((acc, tx) => {
      const key = tx.gameId;

      if (!acc[key]) {
        acc[key] = {
          date: format(new Date(tx.date), "yyyy-MM-dd"),
          description: tx.gameName,
          betAmount: 0,
          profitLoss: 0,
          commission: 0,
        };
      }

      acc[key].betAmount += parseFloat(tx.betAmount) || 0;
      acc[key].profitLoss += (parseFloat(tx.keep) || 0) + (parseFloat(tx.pass) || 0);
      acc[key].commission += parseFloat(tx.commission) || 0;

      return acc;
    }, {});

    // Format results
    const results = Object.values(groupedResults).map(result => ({
      ...result,
      profitLoss: result.profitLoss.toFixed(2),
      betAmount: result.betAmount.toFixed(2),
      commission: result.commission.toFixed(2),
    }));

    return res.status(200).json({
      uniqueCode: "CGP0289",
      message: "Game reports fetched successfully",
      data: { results },
    });

  } catch (error) {
    logger.error("Error fetching game reports:", error);
    return res.status(500).json({
      uniqueCode: "CGP0290",
      message: "Error fetching game reports",
      data: { error: error.message },
    });
  }
};