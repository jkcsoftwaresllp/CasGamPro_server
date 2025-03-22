import { db } from "../../config/db.js";
import { ledger, users, game_rounds, wallet_transactions } from "../../database/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { getGameName } from "../../utils/getGameName.js";
import { convertToDelhiISO, formatDate } from "../../utils/formatDate.js";
import { filterUtils } from "../../utils/filterUtils.js";

const getPrefixBeforeUnderscore = (roundId) => {
  return roundId ? roundId.split("_")[0] : "";
};

export const getUserStatementForParent = async (req, res) => {
  try {
    const agentUserId = req.session.userId;
    const userId = req.params.userId;
    const { limit = 30, offset = 0, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({
        uniqueCode: "CGP0175",
        message: "User ID is required",
        data: {},
      });
    }

    // Verify if the logged-in user is an agent
    const agent = await db
      .select()
      .from(users)
      .where(eq(users.id, agentUserId))
      .then((res) => res[0]);

    if (!agent) {
      return res.status(403).json({
        uniqueCode: "CGP0176",
        message: "Not authorized",
        data: {},
      });
    }

    // Verify the hierarchy
    const userToFetch = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .then((res) => res[0]);

    if (!userToFetch || userToFetch.parent_id !== agentUserId) {
      return res.status(403).json({
        uniqueCode: "CGP0179",
        message: "Unauthorized access to user data",
        data: {} });
    }

    // Apply filters
    const filters = filterUtils({ startDate, endDate, userId });

    // Fetch ledger entries for the specific user
    const ledgerStatements = await db
      .select({
        date: ledger.created_at,
        roundId: ledger.round_id,
        credit: ledger.credit,
        debit: ledger.debit,
        result: ledger.results,
      })
      .from(ledger)
      .where(eq(ledger.user_id, userId))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Fetch from `wallet` for the specific user
    const walletTransactions = await db
      .select({
        date: wallet_transactions.created_at,
        type: wallet_transactions.transaction_type,
        credit:
          sql`CASE WHEN ${wallet_transactions.transaction_type} = 'DEPOSIT' THEN ${wallet_transactions.amount} ELSE 0 END`.as(
            "credit"
          ),
        debit:
          sql`CASE WHEN ${wallet_transactions.transaction_type} = 'WITHDRAWAL' THEN ${wallet_transactions.amount} ELSE 0 END`.as(
            "debit"
          ),
      })
      .from(wallet_transactions)
      .where(eq(wallet_transactions.user_id, userId));

    // Merge both game entries and cash transactions
    let allEntries = [...ledgerStatements, ...walletTransactions];

    allEntries = allEntries.map((entry) => {
      return {
        ...entry,
        date:
          entry.result === "WIN" ? entry.date : convertToDelhiISO(entry.date),
      };
    });

    // Sort transactions by date (descending)
    allEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    const modifiedStatements = await Promise.all(
      allEntries.map(async (entry) => {
        let description = "";

        if (entry.roundId) {
          const gameName = entry.roundId;
          let winOrLoss =
            entry.result === "WIN"
              ? "Win"
              : entry.result === "LOSS"
              ? "Loss"
              : "";
          description = `${winOrLoss} ${gameName}`;
        } else if (entry.type) {
          description = entry.type;
        } else {
          description = `Transaction ${entry.credit ? "Credit" : "Debit"}`;
        }
        runningBalance += entry.credit - entry.debit;
        return {
          date: formatDate(entry.date),
          description,
          credit: entry.credit || 0,
          debit: entry.debit || 0,
          balance: runningBalance,
        };
      })
    );

    return res.status(200).json({
      uniqueCode: "CGP0177",
      message: "User ledger entries fetched successfully",
      data: { results: modifiedStatements.reverse() },
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
