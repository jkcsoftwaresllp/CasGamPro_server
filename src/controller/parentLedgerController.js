import { db } from "../config/db.js";
import { ledger, users, game_bets, game_rounds, games, user_limits_commissions } from "../database/schema.js";
import { eq, inArray } from "drizzle-orm";
import { getBetMultiplier } from "../services/shared/helper/getBetMultiplier.js";
import { formatDate } from "../utils/formatDate.js";
import { filterDateUtils } from "../utils/filterUtils.js";

export const getParentTransactions = async (req, res) => {
  try {
    const { limit = 30, offset = 0, startDate, endDate } = req.query;
    const userId = req.session.userId;
    
    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    // Fetch user info
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ uniqueCode: "CGP0081", message: "User not found", data: {} });
    }

    // Get all descendants (players under the hierarchy)
    const getDescendants = async (parentId) => {
      const children = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.parent_id, parentId));
      let allDescendants = children.map((child) => child.id);
      for (const child of children) {
        allDescendants = allDescendants.concat(await getDescendants(child.id));
      }
      return allDescendants;
    };

    const playerIds = await getDescendants(userId);
    if (playerIds.length === 0) {
      return res.json({ uniqueCode: "CGP0085", message: "No transactions found", data: { results: [] } });
    }

    
    return res.json({ uniqueCode: "CGP0085", message: "Transactions fetched successfully", data: {} });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ uniqueCode: "CGP0086", message: "Internal server error", data: {} });
  }
};
