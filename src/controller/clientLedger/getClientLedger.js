import { db } from "../../config/db.js";
import { ledger, players, rounds } from "../../database/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { formatDate } from "../../utils/formatDate.js";

// Get client ledger entries
export const getClientLedger = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { limit = 30, offset = 0 } = req.query;

    // Get detailed ledger entries with bet results
    const entries = await db
      .select({
        date: ledger.date,
        entry: ledger.entry,
        debit: ledger.debit,
        credit: ledger.credit,
        amount: ledger.amount,
      })
      .from(ledger)
      .where(eq(ledger.userId, userId))
      .orderBy(ledger.id)
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Format response for UI
    const formattedEntries = entries.map((entry) => ({
      date: formatDate(entry.date),
      entry: entry.entry,
      debit: entry.debit || 0,
      credit: entry.credit || 0,
      balance: entry.amount,
    }));

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
