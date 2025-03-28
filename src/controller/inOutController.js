import { db } from "../config/db.js";
import { logger } from "../logger/logger.js";
import { users, ledger } from "../database/schema.js";
import { eq, inArray, and, gte, lte, sql, desc } from "drizzle-orm";
import { formatDate } from "../utils/formatDate.js";

export const inOutReport = async (req, res) => {
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

    // Fetch user details
    const [user] = await db.select().from(users).where(eq(users.id, ownerId));

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
      .selectDistinct({
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

    const formatTransection = transactions.map((pre) => {
      return {
        ...pre,
        date: formatDate(pre.date),
      };
    });

    return res.status(200).json({
      uniqueCode: "CGP0091",
      message: "Transactions fetched successfully",
      data: { results: formatTransection },
    });
  } catch (error) {
    logger.error("Error fetching transactions:", error);
    return res.status(500).json({
      uniqueCode: "CGP0092",
      message: "Internal server error",
      data: {},
    });
  }
};
