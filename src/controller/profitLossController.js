import { db } from "../config/db.js";
import { game_bets, game_rounds, users, user_limits_commissions } from "../database/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";
import { createResponse } from "../helper/responseHelper.js";
import { getGameName } from "../utils/getGameName.js";
import { filterDateUtils } from "../utils/filterUtils.js";
import { getPaginationParams } from "../utils/paginationUtils.js";

export const getProfitLoss = async (req, res) => {
  try {
    const { limit, offset, startDate, endDate } = req.query;
    const userId = req.session.userId;
    const { limit: validLimit, offset: validOffset } = getPaginationParams(limit, offset);

    // Get user details with commission rates
    const [user] = await db
      .select({
        role: users.role,
        commission: user_limits_commissions.max_casino_commission,
      })
      .from(users)
      .leftJoin(
        user_limits_commissions,
        eq(users.id, user_limits_commissions.user_id)
      )
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json(
        createResponse("CGP0036", "User not found")
      );
    }

    // Get all bets under this user based on role
    const betsQuery = db
      .select({
        date: game_rounds.created_at,
        roundId: game_rounds.id,
        gameId: game_rounds.game_id,
        betAmount: game_bets.bet_amount,
        winAmount: game_bets.win_amount,
      })
      .from(game_bets)
      .innerJoin(game_rounds, eq(game_bets.round_id, game_rounds.id))
      .where(
        user.role === "AGENT" 
          ? eq(game_bets.user_id, userId)
          : sql`${game_bets.user_id} IN (
              SELECT id FROM users WHERE parent_id = ${userId}
            )`
      );

    // Apply date filters
    let results = await filterDateUtils({
      query: betsQuery,
      startDate,
      endDate,
    });

    // Calculate profit/loss
    const profitLossData = await Promise.all(
      results.map(async (row) => ({
        date: row.date,
        roundId: row.roundId,
        roundTitle: await getGameName(row.gameId),
        roundEarning: parseFloat(row.winAmount || 0) - parseFloat(row.betAmount),
        commissionEarning: parseFloat(row.betAmount) * (user.commission / 100),
        totalEarning: (parseFloat(row.winAmount || 0) - parseFloat(row.betAmount)) +
          (parseFloat(row.betAmount) * (user.commission / 100)),
      }))
    );

    // Apply pagination
    const paginatedData = profitLossData.slice(validOffset, validOffset + validLimit);

    return res.status(200).json(
      createResponse("CGP0037", "Profit/loss data fetched successfully", {
        results: paginatedData,
      })
    );

  } catch (error) {
    console.error("Error fetching profit/loss data:", error);
    return res.status(500).json(
      createResponse("CGP0038", "Internal server error")
    );
  }
};