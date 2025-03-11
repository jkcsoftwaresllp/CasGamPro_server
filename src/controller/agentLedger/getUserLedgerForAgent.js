import { db } from "../../config/db.js";
import { ledger, cashLedger, players, agents } from "../../database/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { formatDate } from "../../utils/formatDate.js";
import { filterUtils } from "../../utils/filterUtils.js";

export const getUserLedgerForAgent = async (req, res) => {
  try {
    const agentUserId = req.session.userId;
    const userId = req.params.userId;
    const { limit = 30, offset = 0, startDate, endDate } = req.query;
    if (!userId) {
      return res.status(400).json({
        uniqueCode: "CGP0171",
        message: "User ID is required",
        data: {},
      });
    }

    // Verify if the logged-in user is an agent
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, agentUserId))
      .then((res) => res[0]);

    if (!agent) {
      return res.status(403).json({
        uniqueCode: "CGP0172",
        message: "Not authorized as an agent",
        data: {},
      });
    }

    // Apply filters
    const filters = filterUtils({ startDate, endDate, userId });

    // Fetch game ledger entries for the specific user
    const gameEntries = await db
      .select({
        date: ledger.date,
        entry: ledger.entry,
        debit: ledger.debit,
        credit: ledger.credit,
      })
      .from(ledger)
      .where(eq(ledger.userId, userId))
      .orderBy(desc(ledger.date))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Fetch agent transactions (cash receive/pay) for the specific user
    const cashTransactions = await db
      .select({
        date: cashLedger.createdAt,
        entry: cashLedger.description,
        debit: sql`CASE WHEN ${cashLedger.transactionType} = 'TAKE' THEN ABS(${cashLedger.previousBalance}) ELSE 0 END`,
        credit: sql`CASE WHEN ${cashLedger.transactionType} = 'GIVE' THEN ABS(${cashLedger.previousBalance}) ELSE 0 END`,
      })
      .from(cashLedger)
      .innerJoin(players, eq(cashLedger.playerId, players.id))
      .where(eq(players.userId, userId))
      .orderBy(desc(cashLedger.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Merge both game entries and cash transactions
    const allEntries = [...gameEntries, ...cashTransactions];

    // Sort transactions by date (ascending) to compute balance correctly
    allEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    let balance = 0;
    const formattedEntries = allEntries.map((entry) => {
      balance += (entry.credit || 0) - (entry.debit || 0);

      return {
        date: formatDate(entry.date),
        entry: entry.entry,
        debit: entry.debit || 0,
        credit: entry.credit || 0,
        balance: balance,
      };
    });

    return res.status(200).json({
      uniqueCode: "CGP0173",
      message: "User ledger entries fetched successfully",
      data: { results: formattedEntries.reverse() },
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
