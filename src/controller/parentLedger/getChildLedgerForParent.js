import { db } from "../../config/db.js";
import { ledger, users } from "../../database/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { formatDate } from "../../utils/formatDate.js";
import { filterUtils } from "../../utils/filterUtils.js";

export const getUserLedgerForParent = async (req, res) => {
  try {
    const requesterId = req.session.userId;
    const targetUserId = req.params.userId;
    const { limit = 30, offset = 0, startDate, endDate } = req.query;
    if (!targetUserId) {
      return res.status(400).json({
        uniqueCode: "CGP0171",
        message: "User ID is required",
        data: {},
      });
    }

    // Verify hierarchy: requester must be a parent (or higher) of the target user
    const isParent = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .then((res) => res[0]);

    if (!isParent || isParent.parent_id !== requesterId) {
      return res.status(403).json({
        uniqueCode: "CGP0172",
        message: "Not authorized to access this user's ledger",
        data: {},
      });
    }

    // Apply filters
    const filters = filterUtils({ startDate, endDate, userId: targetUserId });

    // Fetch game ledger entries for the specific user
    const gameEntries = await db
      .select({
        date: ledger.created_at,
        entry: ledger.entry,
        debit: ledger.debit,
        credit: ledger.credit,
      })
      .from(ledger)
      .where(eq(ledger.user_id, targetUserId))
      .orderBy(desc(ledger.created_at))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Fetch agent transactions (cash receive/pay) for the specific user
    const cashTransactions = await db
      .select({
        date: ledger.created_at,
        entry: ledger.description,
        debit: sql`CASE WHEN ${ledger.transaction_type} = 'TAKE' THEN ABS(${ledger.previous_balance}) ELSE 0 END`,
        credit: sql`CASE WHEN ${ledger.transaction_type} = 'GIVE' THEN ABS(${ledger.previous_balance}) ELSE 0 END`,
      })
      .from(ledger)
      .where(eq(ledger.user_id, targetUserId))
      .orderBy(desc(ledger.created_at))
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
