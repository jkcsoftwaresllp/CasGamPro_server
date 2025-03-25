import { db } from "../config/db.js";
import { logger } from "../logger/logger.js";
import { users, ledger } from "../database/schema.js";
import { eq, sql } from "drizzle-orm";
import { formatDate } from "../utils/formatDate.js";
import { filterDateUtils } from "../utils/filterUtils.js";

export const inOutReport = async (req, res) => {
  try {
    const {
      limit = 30,
      offset = 0,
      startDate,
      endDate,
      userId,
      clientName,
    } = req.query;
    const userSessionId = req.session.userId;
    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    if (!userSessionId) {
      return res.status(400).json({
        uniqueCode: "CGP0090",
        message: "User ID is required",
        data: {},
      });
    }

    // Fetch user details
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userSessionId));
    if (!user) {
      return res.status(404).json({
        uniqueCode: "CGP0093",
        message: "User not found",
        data: {},
      });
    }

    // Fetch all descendants (players under agents, agents under super-agents, etc.)
    const descendants = await db
      .select()
      .from(users)
      .where(eq(users.parent_id, user.id));
    if (descendants.length === 0) {
      return res.status(200).json({
        uniqueCode: "CGP0095",
        message: "No users found under this account",
        data: [],
      });
    }

    // TODO: Attach Database

    return res.status(200).json({
      uniqueCode: "CGP0091",
      message: "Transactions fetched successfully",
      data: { },
    });
  } catch (error) {
    logger.error("Error fetching transactions:", error);
    return res.status(500).json({
      uniqueCode: "CGP0092",
      message: "Internal server error",
      data: {},
    });
  }
};
