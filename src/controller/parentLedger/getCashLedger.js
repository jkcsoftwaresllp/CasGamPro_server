import { db } from "../../config/db.js";
import { ledger, users } from "../../database/schema.js";
import { eq, desc, sql, inArray, and, gte, lte } from "drizzle-orm";
import { formatDate } from "../../utils/formatDate.js";

export const getCashLedger = async (req, res) => {
  try {
    const ownerId = req.session.userId;
    const userId = req.params.userId;
    const { startDate, endDate, limit = 50, offset = 0 } = req.query;
    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    if (!userId) {
      return res.status(400).json({
        uniqueCode: "CGP0166",
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
            "CGP0064",
            "Either user not found or not under your supervision"
          )
        );
    }

    // Build filters
    let filters = and(
      eq(ledger.user_id, user.id),
      inArray(ledger.transaction_type, ["GIVE", "TAKE"])
    );

    if (startDate)
      filters = and(filters, gte(ledger.created_at, new Date(startDate)));
    if (endDate)
      filters = and(filters, lte(ledger.created_at, new Date(endDate)));

    // Fetch transactions
    const transactions = await db
      .select({
        date: ledger.created_at,
        via: ledger.entry,
        liya: sql`CASE WHEN ${ledger.transaction_type} = 'TAKE' THEN ${ledger.stake_amount} ELSE 0 END`.as(
          "liya"
        ),
        diya: sql`CASE WHEN ${ledger.transaction_type} = 'GIVE' THEN ${ledger.stake_amount} ELSE 0 END`.as(
          "diya"
        ),
        remainingBalance: ledger.new_wallet_balance,
      })
      .from(ledger)
      .where(filters)
      .orderBy(desc(ledger.created_at))
      .limit(recordsLimit)
      .offset(recordsOffset);

    const formatTransactions = transactions.map((pre) => {
      return {
        ...pre,
        date: formatDate(pre.date),
      };
    });

    return res.status(200).json({
      uniqueCode: "CGP0169",
      message: "Cash ledger fetched successfully",
      data: { results: formatTransactions },
    });
  } catch (error) {
    console.error("Error fetching cash ledger:", error);
    return res.status(500).json({
      uniqueCode: "CGP0170",
      message: "Internal server error",
      data: {},
    });
  }
};
