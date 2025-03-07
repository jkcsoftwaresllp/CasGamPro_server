import { db } from "../config/db.js";
import { logger } from "../logger/logger.js";
import { agents, players, ledger, users } from "../database/schema.js";
import { eq, and, gte, lte } from "drizzle-orm";
import { filterUtils } from "../utils/filterUtils.js";
import { formatDate } from "../utils/formatDate.js";

export const inOutReport = async (req, res) => {
  try {
    const agentId = req.session.userId;
    const { startDate, endDate } = req.query;
    const conditions = filterUtils({ agentId, startDate, endDate });
    // Fetch data from database

    const results = await db
      .select({
        date: agents.inoutDate,
        description: agents.inoutDescription,
        aya: agents.aya,
        gya: agents.gya,
        commPositive: agents.commPositive,
        commNegative: agents.commNegative,
        limit: agents.limitValue,
      })
      .from(agents)
      .leftJoin(players, eq(players.agentId, agents.id))
      .leftJoin(users, eq(users.id, players.userId))
      .where(and(...conditions))
      .orderBy(agents.inoutDate);

    // Format response
    const formattedResults = results.map((entry) => ({
      date: formatDate(entry.date),
      description: entry.description,
      aya: entry.aya,
      gya: entry.gya,
      commPosative: entry.commPositive,
      commNegative: entry.commNegative,
      limit: entry.limit,
    }));

    return res.status(200).json({
      uniqueCode: "CGP0088",
      message: "In-Out entry fetched successfully",
      data: { results: formattedResults },
    });
  } catch (error) {
    logger.error("Error In-Out entry fetch:", error);
    return res.status(500).json({
      uniqueCode: "CGP0089",
      message: "Internal server error",
      data: {},
    });
  }
};
