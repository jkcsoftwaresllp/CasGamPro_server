import { db } from "../../config/db.js";
import { players, users } from "../../database/schema.js";
import { sql, eq, and } from "drizzle-orm";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";
import { filterUtils } from "../../utils/filterUtils.js";

export const getCommisionLimits = async (req, res) => {
  try {
    const { limit = 30, offset = 0 } = req.query;

    // Ensure valid numeric limit and offset
    const recordsLimit = Math.min(parseInt(limit) || 30, 100);
    const recordsOffset = parseInt(offset) || 0;

    // Get filter conditions using filterUtils
    const conditions = filterUtils(req.query);

    // Fetch data with filtering
    const results = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        share: players.share,
        casinoCommission: players.casinoCommission || 0,
        lotteryCommission: players.lotteryCommission || 0,
        currentLimit: players.balance || 0, // TODO : CurrentLimit & balance are one and the same things
      })
      .from(players)
      .innerJoin(users, eq(players.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(players.id)
      .limit(recordsLimit)
      .offset(recordsOffset);

    // Fetch total records count
    const totalRecordsQuery = await db
      .select({ count: sql`COUNT(*)` })
      .from(players)
      .innerJoin(users, eq(players.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalRecords = parseInt(totalRecordsQuery[0]?.count) || 0;

    // Calculate next offset
    const nextOffset =
      recordsOffset + recordsLimit < totalRecords
        ? recordsOffset + recordsLimit
        : null;

    let response = {
      uniqueCode: "CGP0051",
      message: "Commission limits fetched successfully",
      data: { results: results, totalRecords, nextOffset },
    };

    logToFolderInfo("Commission/controller", "getCommisionLimits", response);
    return res.json(response);
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
