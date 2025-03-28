import { db } from "../../config/db.js";
import { ledger, users } from "../../database/schema.js";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { formatDate } from "../../utils/formatDate.js";

/**
 * **API Handler:** Calls `getClientPLData` and returns the response.
 */
export const clientPL_API = async (req, res) => {
  try {
    const { limit = 30, offset = 0, startDate, endDate } = req.query;

    const ownerId = req.session.userId;
    const ownerRole = req.session.userRole;
    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        uniqueCode: "CGP0175",
        message: "User ID is required",
        data: {},
      });
    }

    if (!ownerId) {
      return res.status(404).json({
        uniqueCode: "CGP0093",
        message: "Unauthorised Access",
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
            "CGP0093",
            "Either user not found or not under your supervision"
          )
        );
    }

    const transactionType =
      ownerRole === "AGENT"
        ? ["DEPOSIT", "WIDTHDRAWL", "BET_PLACED"]
        : ["COMMISSION"];

    // Build filters
    let filters = and(
      eq(ledger.user_id, user.id),
      inArray(ledger.transaction_type, transactionType)
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

    res.json({
      uniqueCode: "CGP0164",
      message: "Profit & loss data fetched",
      data: { results: formatTransaction },
    });
  } catch (error) {
    console.error("Error fetching client statement:", error);
    res.status(500).json({
      uniqueCode: "CGP0165",
      message: error.message || "Internal server error",
      data: {},
    });
  }
};
