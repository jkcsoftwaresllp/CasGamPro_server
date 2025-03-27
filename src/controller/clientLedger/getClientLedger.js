import { db } from "../../config/db.js";
import { ledger, users } from "../../database/schema.js";
import { eq, inArray, and, gte, lte, sql, desc } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { convertToDelhiISO, formatDate } from "../../utils/formatDate.js";
import { filterDateUtils } from "../../utils/filterUtils.js";
import { date } from "drizzle-orm/pg-core";

// Get client ledger entries with real-time balance calculation
export const getClientLedger = async (req, res) => {
  try {
    const { limit = 30, offset = 0, startDate, endDate } = req.query;

    const ownerId = req.session.userId;
    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    if (!ownerId) {
      return res.status(400).json({
        uniqueCode: "CGP0090",
        message: "Unauthorise Access",
        data: {},
      });
    }

    // Build filters
    let filters = and(
      eq(ledger.user_id, ownerId),
      inArray(ledger.transaction_type, ["DEPOSIT", "WIDTHDRAWL", "BET_PLACED"])
    );

    if (startDate)
      filters = and(filters, gte(ledger.created_at, new Date(startDate)));
    if (endDate)
      filters = and(filters, lte(ledger.created_at, new Date(endDate)));

    // Fetch transactions
    const transactions = await db
      .select({
        shortId: ledger.id,
        date: ledger.created_at,
        entry: ledger.entry,
        debit: sql`CASE 
          WHEN ${ledger.transaction_type} = 'WIDTHDRAWL' THEN ${ledger.stake_amount} 
          WHEN ${ledger.transaction_type} = 'BET_PLACED' THEN ${ledger.stake_amount} 
          ELSE 0 END`.as("debit"),
        credit:
          sql`CASE WHEN ${ledger.transaction_type} = 'DEPOSIT' THEN ${ledger.stake_amount} ELSE 0 END`.as(
            "credit"
          ),
        balance: ledger.new_coins_balance,
      })
      .from(ledger)
      .where(filters)
      .orderBy(desc(ledger.created_at))
      .limit(recordsLimit)
      .offset(recordsOffset);

    const formatTransaction = transactions
      .map((pre) => {
        return {
          ...pre,
          date: formatDate(pre.date),
        };
      })
      .sort((a, b) => b.shortId - a.shortId);

    return res.status(200).json({
      uniqueCode: "CGP0085",
      message: "Ledger entries fetched successfully",
      data: {
        results: formatTransaction,
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
