import { db } from "../config/db.js";
import { users, game_rounds, game_bets, user_limits_commissions } from "../database/schema.js";
import { eq, sql, desc, inArray } from "drizzle-orm";
import { filterDateUtils } from "../utils/filterUtils.js";
import { logger } from "../logger/logger.js";
import { getGameName } from "../utils/getGameName.js";
import { formatDate } from "../utils/formatDate.js";

// Recursive function to get all descendants
const getAllDescendants = async (parentId) => {
  const descendants = await db.select().from(users).where(eq(users.parent_id, parentId));
  let allDescendants = [...descendants];

  for (const descendant of descendants) {
    const childDescendants = await getAllDescendants(descendant.id);
    allDescendants = [...allDescendants, ...childDescendants];
  }
  return allDescendants;
};

export const getProfitLoss = async (req, res) => {
  try {
    const { limit = 30, offset = 0, startDate, endDate } = req.query;
    const userId = req.session.userId;

    // Validate and set limit/offset
    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    // Fetch user details
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ uniqueCode: "CGP0093", message: "User not found", data: {} });
    }

    let profitLossData = [];

    // Fetch all descendants recursively
    const descendants = await getAllDescendants(user.id);
    if (descendants.length === 0) {
      return res.status(200).json({ uniqueCode: "CGP0095", message: "No users found under this account", data: [] });
    }

    const descendantIds = descendants.map((d) => d.id);

    // Fetch commission rates
    const commissions = await db
      .select()
      .from(user_limits_commissions)
      .where(inArray(user_limits_commissions.user_id, descendantIds));
    
    const commissionMap = commissions.reduce((acc, commission) => {
      acc[commission.user_id] = commission.max_casino_commission;
      return acc;
    }, {});

    // Fetch profit/loss data for all descendants
    let profitLossResults = await db
      .select({
        date: game_rounds.created_at,
        roundId: game_rounds.id,
        gameId: game_rounds.game_id,
        roundEarning: sql`
          COALESCE(
            SUM(${game_bets.bet_amount}) - SUM(CASE WHEN ${game_bets.win_amount} > 0 THEN ${game_bets.win_amount} ELSE 0 END), 
            0
          )
        `,
        commissionEarning: sql`
          COALESCE(SUM(${game_bets.bet_amount} * ${commissionMap[user.id] || 0} / 100), 0)
        `,
        totalEarning: sql`
          COALESCE(
            SUM(${game_bets.bet_amount}) - SUM(CASE WHEN ${game_bets.win_amount} > 0 THEN ${game_bets.win_amount} ELSE 0 END) + 
            SUM(${game_bets.bet_amount} * ${commissionMap[user.id] || 0} / 100),
            0
          )
        `,
      })
      .from(game_rounds)
      .leftJoin(game_bets, eq(game_bets.round_id, game_rounds.id))
      .where(inArray(game_bets.user_id, descendantIds))
      .groupBy(game_rounds.id)
      .orderBy(desc(game_rounds.created_at));

    // Apply date filtering
    profitLossResults = filterDateUtils({ data: profitLossResults, startDate, endDate });

    if (profitLossResults.length > 0) {
      profitLossData = await Promise.all(
        profitLossResults.map(async (row) => ({
          date: formatDate(row.date),
          roundId: row.roundId.toString(),
          roundTitle: await getGameName(row.gameId),
          roundEarning: parseFloat(row.roundEarning),
          commissionEarning: parseFloat(row.commissionEarning),
          totalEarning: parseFloat(row.totalEarning),
        }))
      );
    }

    profitLossData = profitLossData.slice(recordsOffset, recordsOffset + recordsLimit);

    return res.status(200).json({ uniqueCode: "CGP0099", message: "Profit/loss data fetched successfully", data: { results: profitLossData } });
  } catch (error) {
    logger.error("Error fetching profit/loss data:", error);
    return res.status(500).json({ uniqueCode: "CGP0100", message: "Internal server error", data: {} });
  }
};