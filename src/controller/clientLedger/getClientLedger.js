import { db } from "../../config/db.js";
import { ledger, players, rounds } from "../../database/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../../logger/logger.js";

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
        balance: ledger.balance,
        roundId: ledger.roundId,
        status: ledger.status,
        result: ledger.result,
        // Calculate running profit/loss
        profitLoss: sql`SUM(${ledger.credit} - ${ledger.debit}) OVER (ORDER BY ${ledger.date})`,
        // Include commission if applicable
        commission: sql`CASE 
          WHEN ${ledger.status} = 'BET_PLACED' 
          THEN ${ledger.amount} * (SELECT casinoCommission FROM players WHERE userId = ${userId}) / 100
          ELSE 0 
        END`,
      })
      .from(ledger)
      .where(eq(ledger.userId, userId))
      .orderBy(desc(ledger.date))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Format response for UI
    const formattedEntries = entries.map((entry) => ({
      date: entry.date.toISOString(),
      entry: entry.entry,
      debit: entry.debit || 0,
      credit: entry.credit || 0,
      balance: entry.balance,
      profitLoss: parseFloat(entry.profitLoss) || 0,
      commission: parseFloat(entry.commission) || 0,
      roundId: entry.roundId,
      status: entry.status,
      result: entry.result,
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