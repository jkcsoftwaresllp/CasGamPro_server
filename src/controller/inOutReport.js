import { db } from "../config/db.js";
import { logger } from "../logger/logger.js";
import { agents, coinsLedger, users } from "../database/schema.js";
import { eq, sql, desc, sum } from "drizzle-orm";

export const inOutReport = async (req, res) => {
  try {
    const agentUserId = req.session.userId;
    if (!agentUserId) {
      return res.status(400).json({
        uniqueCode: "CGP0090",
        message: "Agent User ID is required",
        data: {},
      });
    }

    const agentRecord = await db
      .select({ agentId: agents.id })
      .from(agents)
      .where(eq(agents.userId, agentUserId))
      .limit(1);

    if (agentRecord.length === 0) {
      return res.status(404).json({
        uniqueCode: "CGP0093",
        message: "Agent not found",
        data: {},
      });
    }

    const agentId = agentRecord[0].agentId;

    const transactions = await db
      .select({
        date: sql`DATE(${coinsLedger.createdAt})`.as("date"),
        userId: coinsLedger.userId,
        username: users.username,
        totalDeposit: sum(
          sql`CASE WHEN ${coinsLedger.type} = 'DEPOSIT' THEN ${coinsLedger.amount} ELSE 0 END`
        ).as("totalDeposit"),
        totalWithdrawal: sum(
          sql`CASE WHEN ${coinsLedger.type} = 'WITHDRAWAL' THEN ${coinsLedger.amount} ELSE 0 END`
        ).as("totalWithdrawal"),
        latestBalance: sql`MAX(${coinsLedger.newBalance})`.as("latestBalance"),
      })
      .from(coinsLedger)
      .leftJoin(users, eq(coinsLedger.userId, users.id))
      .where(eq(coinsLedger.agentId, agentId))
      .groupBy(
        sql`DATE(${coinsLedger.createdAt}), ${coinsLedger.userId}, ${users.username}`
      )
      .orderBy(desc(sql`DATE(${coinsLedger.createdAt})`));

    const formattedResults = transactions.map((entry) => {
      const clientName = entry.username || "Unknown User";
      return {
        date: entry.date,
        username: clientName,
        description: `Total deposited and withdrawn amount for ${clientName}`,
        debit: entry.totalDeposit || 0,
        credit: entry.totalWithdrawal || 0,
        balance: entry.latestBalance,
      };
    });

    return res.status(200).json({
      uniqueCode: "CGP0091",
      message: "Agent transactions summarized successfully",
      data: { results: formattedResults },
    });
  } catch (error) {
    logger.error("Error fetching agent transactions:", error);
    return res.status(500).json({
      uniqueCode: "CGP0092",
      message: "Internal server error",
      data: {},
    });
  }
};
