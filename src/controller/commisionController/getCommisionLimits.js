import { db } from "../../config/db.js";
import { players, users } from "../../database/schema.js";
import { sql, eq, and, gte, lte } from "drizzle-orm";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";
import { filterUtils } from "../../utils/filterUtils.js";

export const getCommisionLimits = async (req, res) => {
  try {
    const { limit = 30, offset = 0 } = req.query;

    // Ensure valid numeric limit and offset
    const recordsLimit = Math.min(parseInt(limit) || 30, 100);
    const recordsOffset = parseInt(offset) || 0;

    // Get filter conditions using the separate function
    const conditions = filterUtils(req.query);
    // Fetch data with filtering
    const results = await db
      .select({
        userId: users.id,
        clientName: users.username,
        share: players.share,
        sessionCommission: players.sessionCommission,
        currentLimit: players.fixLimit,
      })
      .from(players)
      .innerJoin(users, eq(players.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(players.id)
      .limit(recordsLimit)
      .offset(recordsOffset);

    // Fetch total records count
    const totalRecords = await db
      .select({ count: sql`COUNT(*)` })
      .from(players)
      .innerJoin(users, eq(players.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Calculate next offset
    const nextOffset =
      recordsOffset + recordsLimit < totalRecords[0].count
        ? recordsOffset + recordsLimit
        : null;

    let temp = {
      uniqueCode: "CGP0051",
      message: "Commission limits fetched successfully",
      data: { results, totalRecords: totalRecords[0].count, nextOffset },
    };

    logToFolderInfo("Commission/controller", "getCommisionLimits", temp);
    return res.json(temp);
  } catch (error) {
    let tempError = {
      uniqueCode: "CGP0052",
      message: "Internal Server Error",
      data: { error: error.message },
    };

    logToFolderError("Commission/controller", "getCommisionLimits", tempError);
    console.error("Error fetching commission limits:", error);
    return res.status(500).json(tempError);
  }
};
