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

   // TODO : Add Database

    return res.status(200).json({ uniqueCode: "CGP0099", message: "Profit/loss data fetched successfully", data: {} });
  } catch (error) {
    logger.error("Error fetching profit/loss data:", error);
    return res.status(500).json({ uniqueCode: "CGP0100", message: "Internal server error", data: {} });
  }
};