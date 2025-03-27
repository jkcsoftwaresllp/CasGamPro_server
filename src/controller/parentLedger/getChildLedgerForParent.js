import { db } from "../../config/db.js";
import { ledger, users } from "../../database/schema.js";
import { eq, inArray, and, gte, lte, sql, desc } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { formatDate } from "../../utils/formatDate.js";

export const getUserLedgerForParent = async (req, res) => {
  try {
    const ownerId = req.session.userId;
    const userId = req.params.userId;
    const { startDate, endDate, limit = 50, offset = 0 } = req.query;
    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    if (!userId) {
      return res.status(400).json({
        uniqueCode: "CGP0171",
        message: "User ID is required",
        data: {},
      });
    }

    // Fetch user details with current exposure
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.parent_id, ownerId)));

    if (!user) {
      return res
        .status(404)
        .json(
          createResponse(
            "error",
            "CGP0172",
            "Either user not found or not under your supervision"
          )
        );
    }

    // Build filters
    let filters = and(
      eq(ledger.user_id, user.id),
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
      uniqueCode: "CGP0173",
      message: "User ledger entries fetched successfully",
      data: { results: formatTransaction },
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
