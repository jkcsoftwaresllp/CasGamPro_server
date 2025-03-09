import { db } from "../../config/db.js";
import { ledger, cashLedger, players } from "../../database/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { convertToDelhiISO, formatDate } from "../../utils/formatDate.js";
import { filterUtils } from "../../utils/filterUtils.js";

// Get client ledger entries with real-time balance calculation
export const getClientLedger = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { limit = 30, offset = 0, startDate, endDate } = req.query;

    // Apply filters
    const filters = filterUtils({ startDate, endDate, userId });

    // Fetch game ledger entries sorted by ID (newest first)
    const gameEntries = await db
      .select({
        date: ledger.date,
        entry: ledger.entry,
        debit: ledger.debit,
        credit: ledger.credit,
        sortId: ledger.id,
      })
      .from(ledger)
      .where(eq(ledger.userId, userId))
      .orderBy(desc(ledger.id))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Fetch cash transactions sorted by date (newest first)
    const cashTransactions = await db
      .select({
        date: cashLedger.createdAt,
        entry: cashLedger.description,
        debit: sql`CASE WHEN ${cashLedger.transactionType} = 'TAKE' THEN ABS(${cashLedger.amount}) ELSE 0 END`,
        credit: sql`CASE WHEN ${cashLedger.transactionType} = 'GIVE' THEN ABS(${cashLedger.amount}) ELSE 0 END`,
        sortId: cashLedger.id,
      })
      .from(cashLedger)
      .innerJoin(players, eq(cashLedger.playerId, players.id))
      .where(eq(players.userId, userId))
      .orderBy(desc(cashLedger.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Merge both gameEntries and cashTransactions
    let allEntries = [...gameEntries, ...cashTransactions];

    allEntries = allEntries.map((entry) => {
      return {
        ...entry,
        date: entry.entry.startsWith("Win")
          ? entry.date
          : convertToDelhiISO(entry.date),
      };
    });

    // Sort entries by date (descending), if same date then sort by ID (descending)
    allEntries.sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      return dateDiff !== 0 ? dateDiff : b.sortId - a.sortId;
    });

    let balance = 0;
    const formattedEntries = allEntries
      .reverse()
      .map((entry) => {
        balance += (entry.credit || 0) - (entry.debit || 0);
        // if (entry.entry.startsWith("Win"))
        //   console.log({ entry: entry.entry, date: entry.date });
        return {
          date: formatDate(entry.date),
          entry: entry.entry,
          debit: entry.debit || 0,
          credit: entry.credit || 0,
          balance,
        };
      })
      .reverse();

    return res.status(200).json({
      uniqueCode: "CGP0085",
      message: "Ledger entries fetched successfully",
      data: { results: formattedEntries },
    });
  } catch (error) {
    logger.error("Error fetching ledger entries:", error);
    return res.status(500).json({
      uniqueCode: "CGP0086",
      message: "Internal server error",
      data: {},
    });
  }
};
