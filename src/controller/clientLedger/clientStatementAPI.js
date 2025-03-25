import { db } from "../../config/db.js";
import { ledger } from "../../database/schema.js";
import { formatDate } from "../../utils/formatDate.js";

import { eq, inArray, and, gte, lte, sql, desc } from "drizzle-orm";

export const clientStatementAPI = async (req, res) => {
  const userId = req.session.userId;

  try {
    const { limit = 30, offset = 0, startDate, endDate } = req.query;

    // Validate and set limit/offset
    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    // Build filters
    let filters = and(
      eq(ledger.user_id, userId),
      inArray(ledger.transaction_type, ["DEPOSIT", "WIDTHDRAWL", "BET_PLACED"])
    );

    if (startDate)
      filters = and(filters, gte(ledger.created_at, new Date(startDate)));
    if (endDate)
      filters = and(filters, lte(ledger.created_at, new Date(endDate)));

    // Fetch transactions
    const transactions = await db
      .select({
        date: ledger.created_at,
        description: ledger.entry,
        debit: sql`
          CASE 
            WHEN ${ledger.transaction_type} = 'WIDTHDRAWL' THEN ${ledger.stake_amount} 
            WHEN ${ledger.transaction_type} = 'BET_PLACED' THEN ${ledger.stake_amount} 
            ELSE 0 
          END
        `.as("debit"),
        credit: sql`
          CASE 
            WHEN ${ledger.transaction_type} = 'DEPOSIT' THEN ${ledger.stake_amount} 
            ELSE 0 
          END
        `.as("credit"),
        balance: ledger.new_wallet_balance,
      })
      .from(ledger)
      .where(filters)
      .orderBy(desc(ledger.created_at))
      .limit(recordsLimit)
      .offset(recordsOffset);

    // Format transactions
    const formatTransection = transactions.map((pre) => ({
      ...pre,
      date: formatDate(pre.date),
    }));

    res.json({
      uniqueCode: "CGP0164",
      message: "Client statement fetched successfully",
      data: {
        results: formatTransection,
      },
    });
  } catch (error) {
    console.error("Error fetching client statement:", error);
    res.status(500).json({
      uniqueCode: "CGP0165",
      message: "Internal server error",
      data: {},
    });
  }
};
