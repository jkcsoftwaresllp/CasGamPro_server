import { db } from "../../config/db.js";
import { players, users } from "../../database/schema.js";
import { sql, eq, and, gte, lte } from "drizzle-orm";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const getCommisionLimits = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      userId,
      clientName,
      limit = 30,
      offset = 0,
    } = req.query;

    // Ensure valid numeric limit and offset
    const recordsLimit = Math.min(parseInt(limit) || 30, 100);
    const recordsOffset = parseInt(offset) || 0;

    // Construct filtering conditions
    let conditions = [];
    if (userId) conditions.push(eq(players.userId, userId));
    if (clientName) conditions.push(eq(users.username, clientName));

    // Date filtering (default: last 30 records)
    const formatDateForMySQL = (dateStr) => {
      const [year, month, day] = dateStr.split("-");
      return `${year}-${month}-${day} 00:00:00`;
    };

    if (startDate) {
      conditions.push(
        gte(
          users.created_at,
          sql`CAST(${formatDateForMySQL(startDate)} AS DATETIME)`
        )
      );
    }

    if (endDate) {
      conditions.push(
        lte(
          users.created_at,
          sql`CAST(${formatDateForMySQL(endDate).replace(
            "00:00:00",
            "23:59:59"
          )} AS DATETIME)`
        )
      );
    }

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
