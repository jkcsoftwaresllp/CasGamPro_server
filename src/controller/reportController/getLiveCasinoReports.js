import { db } from "../../config/db.js";
import { users, game_bets, game_rounds, games, game_categories } from "../../database/schema.js";
import { sql, eq, and, desc, inArray } from "drizzle-orm";
import { format } from "date-fns";
import { logger } from "../../logger/logger.js";
import { filterDateUtils } from "../../utils/filterUtils.js";
import { getBetMultiplier } from "../../services/shared/helper/getBetMultiplier.js";

// Get main casino summary
export const getLiveCasinoReports = async (req, res) => {
  try {
    const { limit = 30, offset = 0 } = req.query;
    const userId = req.session.userId;
    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    // Fetch user role and hierarchy
    const [user] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ uniqueCode: "CGP0281", message: "User not found", data: {} });
    }

    // Fetch all player IDs under the current user in the hierarchy
    const getPlayerIds = async (parentId) => {
      const usersHierarchy = await db.select({ id: users.id }).from(users).where(eq(users.parent_id, parentId));
      let playerIds = usersHierarchy.map((u) => u.id);
      for (let user of usersHierarchy) {
        playerIds = playerIds.concat(await getPlayerIds(user.id));
      }
      return playerIds;
    };

    const playerIds = await getPlayerIds(user.id);
    if (playerIds.length === 0) {
      return res.status(200).json({
        uniqueCode: "CGP0284",
        message: "No data available",
        data: { results: [] },
      });
    }

    // Get casino profit/loss summary
    const query = db
      .select({
        title: game_categories.name,
        date: sql`DATE(${game_rounds.created_at})`,
        profitLoss: sql`
          SUM(
            CASE 
              WHEN ${game_bets.win_amount} IS NOT NULL THEN -${game_bets.bet_amount} 
              ELSE ${game_bets.bet_amount}
            END
          )
        `,
      })
      .from(game_categories)
      .innerJoin(games, eq(games.category_id, game_categories.id))
      .innerJoin(game_rounds, eq(game_rounds.game_id, games.id))
      .innerJoin(game_bets, eq(game_bets.round_id, game_rounds.id))
      .where(inArray(game_bets.user_id, playerIds))
      .groupBy(game_categories.name, sql`DATE(${game_rounds.created_at})`)
      .orderBy(desc(sql`DATE(${game_rounds.created_at})`));

    const results = await query;

    // Extract date filters from query parameters
    const { startDate, endDate } = req.query;
    const filteredResults = filterDateUtils({ data: results, startDate, endDate });

    // Format dates and numbers
    const formattedResults = filteredResults.map((result) => ({
      ...result,
      date: format(new Date(result.date), "yyyy-MM-dd"),
      profitLoss: Number(result.profitLoss || 0).toFixed(2),
    }));

    return res.status(200).json({
      uniqueCode: "CGP0284",
      message: "Live casino reports fetched successfully",
      data: {
        results: formattedResults.reverse().slice(recordsOffset, recordsOffset + recordsLimit),
      },
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
  
      // Fetch user role and hierarchy
      const [user] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ uniqueCode: "CGP0286", message: "User not found", data: {} });
      }
  
      let results = [];
      
      // Get all players under the hierarchy of the requesting user
      const playerIds = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.parent_id, user.id));
  
      if (playerIds.length === 0) {
        return res.status(200).json({ uniqueCode: "CGP0289", message: "No data found", data: { results } });
      }
  
      const dbResult = await db
        .select({
          betAmount: game_bets.bet_amount,
          win: game_bets.win_amount,
          betSide: game_bets.bet_side,
          gameType: games.gameType,
          description: games.name,
        })
        .from(game_categories)
        .innerJoin(games, eq(games.category_id, game_categories.id))
        .innerJoin(game_rounds, eq(game_rounds.game_id, games.id))
        .innerJoin(game_bets, eq(game_bets.round_id, game_rounds.id))
        .innerJoin(users, eq(game_bets.user_id, users.id))
        .where(
          and(
            sql`users.id IN (${playerIds.map((p) => p.id).join(",")})`,
            eq(game_categories.name, categoryName),
            eq(sql`DATE(${game_rounds.created_at})`, date)
          )
        );
  
      const gameStats = dbResult.reduce((acc, entry) => {
        if (!acc[entry.gameType]) {
          acc[entry.gameType] = {
            totalBetAmount: 0,
            winningBets: 0,
            lossingBets: 0,
            winningAmount: 0,
          };
        }
  
        acc[entry.gameType].totalBetAmount += entry.betAmount;
        if (entry.win) {
          acc[entry.gameType].winningBets += entry.betAmount;
        }
  
        return acc;
      }, {});
  
      for (const gameType in gameStats) {
        gameStats[gameType].winningAmount = await Promise.all(
          dbResult
            .filter((entry) => entry.gameType === gameType)
            .map(async (entry) => {
              if (entry.win) {
                const multiplier = await getBetMultiplier(entry.gameType, entry.betSide);
                return entry.betAmount * multiplier;
              }
              return 0;
            })
        ).then((values) => values.reduce((sum, val) => sum + val, 0));
  
        gameStats[gameType].lossingBets = gameStats[gameType].winningBets - gameStats[gameType].totalBetAmount;
        const { totalBetAmount, winningBets, lossingBets, winningAmount } = gameStats[gameType];
  
        const clientProfit = winningAmount - winningBets;
        const overallClientPL = clientProfit + lossingBets;
        const overAllHierarchyPL = -overallClientPL;
  
        results.push({
          date: date,
          betAmount: totalBetAmount,
          companyPL: overAllHierarchyPL,
          description: gameType,
        });
      }
  
      return res.status(200).json({ uniqueCode: "CGP0289", message: "Game reports fetched successfully", data: { results } });
    } catch (error) {
      logger.error("Error fetching game reports:", error);
      return res.status(500).json({ uniqueCode: "CGP0290", message: "Error fetching game reports", data: { error: error.message } });
    }
  };
