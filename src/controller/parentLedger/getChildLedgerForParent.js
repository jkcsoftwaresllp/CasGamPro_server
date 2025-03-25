import { db } from "../../config/db.js";
import { ledger, users } from "../../database/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { formatDate } from "../../utils/formatDate.js";
import { filterUtils } from "../../utils/filterUtils.js";

export const getUserLedgerForParent = async (req, res) => {
  try {
    const requesterId = req.session.userId;
    const targetUserId = req.params.userId;
    const { limit = 30, offset = 0, startDate, endDate } = req.query;
    if (!targetUserId) {
      return res.status(400).json({
        uniqueCode: "CGP0171",
        message: "User ID is required",
        data: {},
      });
    }

    // Verify hierarchy: requester must be a parent (or higher) of the target user
    const isParent = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .then((res) => res[0]);

    if (!isParent || isParent.parent_id !== requesterId) {
      return res.status(403).json({
        uniqueCode: "CGP0172",
        message: "Not authorized to access this user's ledger",
        data: {},
      });
    }

    // Apply filters
    const filters = filterUtils({ startDate, endDate, userId: targetUserId });

    //TODO: Attach Database

    return res.status(200).json({
      uniqueCode: "CGP0173",
      message: "User ledger entries fetched successfully",
      data: { },
    });
  } catch (error) {
    logger.error("Error fetching user ledger entries:", error);
    return res.status(500).json({
      uniqueCode: "CGP0174",
      message: "Internal server error",
      data: {},
    });
  }
};
