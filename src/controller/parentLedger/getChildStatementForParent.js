import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { ledger, users } from "../../database/schema.js";
import { logger } from "../../logger/logger.js";
import { db } from "../../config/db.js";
import { formatDate } from "../../utils/formatDate.js";

export const getUserStatementForParent = async (req, res) => {
  try {
    const ownerId = req.session.userId;
    const userId = req.params.userId;

    const { limit = 30, offset = 0, startDate, endDate } = req.query;
    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    if (!userId) {
      return res.status(400).json({
        uniqueCode: "CGP0175",
        message: "User ID is required",
        data: {},
      });
    }

    if (!ownerId) {
      return res.status(400).json({
        uniqueCode: "CGP0090",
        message: "You are not Authorise for accessing this",
        data: {},
      });
    }

    // Fetch user details
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.parent_id, ownerId)))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        uniqueCode: "CGP0093",
        message: "User not found",
        data: {},
      });
    }

    // Build filters
    let filters = and(
      eq(ledger.user_id, user.id),
      inArray(ledger.transaction_type, ["DEPOSIT", "WIDTHDRAWL"])
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
        debit:
          sql`CASE WHEN ${ledger.transaction_type} = 'WIDTHDRAWL' THEN ${ledger.stake_amount} ELSE 0 END`.as(
            "debit"
          ),
        credit:
          sql`CASE WHEN ${ledger.transaction_type} = 'DEPOSIT' THEN ${ledger.stake_amount} ELSE 0 END`.as(
            "credit"
          ),
        balance: ledger.new_wallet_balance,
      })
      .from(ledger)
      .where(filters)
      .orderBy(desc(ledger.created_at))
      .limit(recordsLimit)
      .offset(recordsOffset);

    const formatTransaction = transactions.map((pre) => {
      return {
        ...pre,
        date: formatDate(pre.date),
      };
    });

    return res.status(200).json({
      uniqueCode: "CGP0177",
      message: "User ledger entries fetched successfully",
      data: { results: formatTransaction },
    });
  } catch (error) {
    logger.error("Error fetching user ledger entries:", error);
    return res.status(500).json({
      uniqueCode: "CGP0178",
      message: "Internal server error",
      data: {},
    });
  }
};
