import { db } from "../config/db.js";
import { logger } from "../logger/logger.js";
import { agents, coinsLedger, users } from "../database/schema.js";
import { eq, sql, desc } from "drizzle-orm";

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

    // Fetch agent ID
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

    // Fetch individual transactions instead of summing them up
    const transactions = await db
      .select({
        date: sql`DATE(${coinsLedger.createdAt})`.as("date"),
        userId: coinsLedger.userId,
        username: users.username,
        type: coinsLedger.type,
        amount: coinsLedger.amount,
        newBalance: coinsLedger.newBalance,
      })
      .from(coinsLedger)
      .leftJoin(users, eq(coinsLedger.userId, users.id))
      .where(eq(coinsLedger.agentId, agentId))
      .orderBy(
        desc(sql`DATE(${coinsLedger.createdAt})`),
        desc(sql`TIME(${coinsLedger.createdAt})`)
      );

    let lastBalance = 0; // To track the latest balance dynamically

    const formattedResults = transactions.map((entry, index) => {
      return {
        date: entry.date,
        description:
          entry.type === "WITHDRAWAL"
            ? `Withdrawal from ${entry.username}`
            : `Deposit to ${entry.username}`,
        debit: entry.type === "WITHDRAWAL" ? entry.amount : 0,
        credit: entry.type === "DEPOSIT" ? entry.amount : 0,
        balance: entry.newBalance,
      };
    });

    return res.status(200).json({
      uniqueCode: "CGP0091",
      message: "Agent transactions fetched successfully",
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
