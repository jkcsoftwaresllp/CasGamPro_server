import { db } from "../config/db.js";
import { users, ledger } from "../database/schema.js";
import { eq, desc, inArray, and, gte, lte } from "drizzle-orm";
import { logger } from "../logger/logger.js";
import { formatDate } from "../utils/formatDate.js";

export const getProfitLoss = async (req, res) => {
  try {
    const { limit = 30, offset = 0, startDate, endDate } = req.query;

    const ownerId = req.session.userId;
    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    if (!ownerId) {
      return res.status(404).json({
        uniqueCode: "CGP0093",
        message: "Unauthorised Access",
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
      inArray(ledger.transaction_type, ["COMMISSION"])
    );

    if (startDate)
      filters = and(filters, gte(ledger.created_at, new Date(startDate)));
    if (endDate)
      filters = and(filters, lte(ledger.created_at, new Date(endDate)));

    // Fetch transactions
    const transactions = await db
      .select({
        date: ledger.created_at,
        roundId: ledger.round_id,
        roundTitle: ledger.entry,
        totalEarning: ledger.new_coins_balance,
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
        // roundEarning : ""
        // commissionEarning : ""
      };
    });

    return res.status(200).json({
      uniqueCode: "CGP0099",
      message: "Profit/loss data fetched successfully",
      data: { results: formatTransaction },
    });
  } catch (error) {
    logger.error("Error fetching profit/loss data:", error);
    return res.status(500).json({
      uniqueCode: "CGP0100",
      message: "Internal server error",
      data: {},
    });
  }
};
