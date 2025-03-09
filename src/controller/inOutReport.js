import { db } from "../config/db.js";
import { logger } from "../logger/logger.js";
import { agents, coinsLedger, users } from "../database/schema.js";
import { eq, sql, desc } from "drizzle-orm";
import { formatDate } from "../utils/formatDate.js";

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

    // Fetch transactions ordered by date & time (oldest first)
    const transactions = await db
      .select({
        date: coinsLedger.createdAt,
        username: users.username,
        type: coinsLedger.type,
        amount: coinsLedger.amount,
      })
      .from(coinsLedger)
      .leftJoin(users, eq(users.id, coinsLedger.userId))
      .where(eq(coinsLedger.agentId, agentId))
      .orderBy(
        sql`DATE(${coinsLedger.createdAt})`,
        sql`TIME(${coinsLedger.createdAt})`
      ); // Oldest transactions first

    let prevBalance = 0; // Initialize balance tracking

    let totalCredit = 0;
    let totalDebit = 0;

    const formattedResults = transactions.map((entry, index) => {
      let credit = entry.type === "DEPOSIT" ? parseFloat(entry.amount) : 0;
      let debit = entry.type === "WITHDRAWAL" ? parseFloat(entry.amount) : 0;

      // Update totals
      totalCredit += credit;
      totalDebit += debit;
      prevBalance = parseFloat(prevBalance);
      // First entry logic
      if (index === 0) {
        prevBalance = credit - debit; // Start balance from 0
      } else {
        prevBalance =
          entry.type === "DEPOSIT" ? prevBalance + credit : prevBalance - debit;
      }

      return {
        date: formatDate(entry.date, "Asia/Kolkata"),
        description:
          entry.type === "WITHDRAWAL"
            ? `Limit Decreased of ${entry.username}`
            : `Limit Increased of ${entry.username}`,
        debit,
        credit,
        balance: prevBalance,
      };
    });

    return res.status(200).json({
      uniqueCode: "CGP0091",
      message: "Agent transactions fetched successfully",
      data: {
        results: formattedResults,
        totalCredit,
        totalDebit,
        finalBalance: prevBalance, // Final computed balance
      },
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
