import { db } from "../../config/db.js";
import { ledger, cashLedger, players } from "../../database/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { convertToDelhiISO, formatDate } from "../../utils/formatDate.js";
import { filterDateUtils } from "../../utils/filterUtils.js";

// Get client ledger entries with real-time balance calculation
export const getClientLedger = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { limit = 30, offset = 0, startDate, endDate } = req.query;

    // Validate and set limit/offset
    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    // Fetch game ledger entries sorted by date
    const gameEntries = await db
      .select({
        date: ledger.date,
        entry: ledger.entry,
        debit: ledger.debit,
        credit: ledger.credit,
        sortId: ledger.id,
        type: sql`'game'`.as("type"),
      })
      .from(ledger)
      .where(eq(ledger.userId, userId))
      .orderBy(desc(ledger.date))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Fetch cash ledger entries sorted by date
    const cashTransactions = await db
      .select({
        date: cashLedger.createdAt,
        entry: cashLedger.description,
        debit: sql`CASE WHEN ${cashLedger.transactionType} = 'TAKE' THEN ABS(${cashLedger.amount}) ELSE 0 END`,
        credit: sql`CASE WHEN ${cashLedger.transactionType} = 'GIVE' THEN ABS(${cashLedger.amount}) ELSE 0 END`,
        sortId: cashLedger.id,
        type: sql`'cash'`.as("type"),
      })
      .from(cashLedger)
      .innerJoin(players, eq(cashLedger.playerId, players.id))
      .where(eq(players.userId, userId))
      .orderBy(desc(cashLedger.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Merge both entries
    let allEntries = [...gameEntries, ...cashTransactions];

    // Filter by date range
    allEntries = filterDateUtils({ data: allEntries, startDate, endDate });

    // Convert date formats
    allEntries = allEntries.map((entry) => ({
      ...entry,
      date: entry.type === "game" ? convertToDelhiISO(entry.date) : entry.date,
    }));

    // Correct Sorting: Sort by date first, if same date then by sortId
    allEntries.sort((a, b) => {
      const dateDiff = new Date(a.date) - new Date(b.date);
      return dateDiff !== 0 ? dateDiff : a.sortId - b.sortId;
    });

    // Real-time balance calculation
    let balance = 0;
    const formattedEntries = allEntries.map((entry) => {
      balance += (entry.credit || 0) - (entry.debit || 0);
      return {
        date: formatDate(entry.date),
        entry: entry.entry,
        debit: entry.debit || 0,
        credit: entry.credit || 0,
        balance,
      };
    });

    const paginatedEntries = formattedEntries
      .reverse()
      .slice(recordsOffset, recordsOffset + recordsLimit);

    return res.status(200).json({
      uniqueCode: "CGP0085",
      message: "Ledger entries fetched successfully",
      data: {
        results: paginatedEntries,
      },
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
