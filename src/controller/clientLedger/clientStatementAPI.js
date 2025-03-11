import { db } from "../../config/db.js";
import {
  ledger,
  rounds,
  users,
  coinsLedger,
  agents,
} from "../../database/schema.js";
import { eq, sql } from "drizzle-orm";
// import { getGameName } from "../../utils/getGameName.js";
import { formatDate } from "../../utils/formatDate.js";
import { filterDateUtils } from "../../utils/filterUtils.js"; // Import date filtering

// const getPrefixBeforeUnderscore = (roundId) => {
//   return roundId ? roundId.split("_")[0] : "";
// };

export const clientStatementAPI = async (req, res) => {
  const userId = req.session.userId;

  try {
    const { startDate, endDate } = req.query;

    // Fetch transactions from `ledger`
    const ledgerStatements = await db
      .select({
        date: ledger.date,
        roundId: ledger.roundId,
        credit: ledger.credit,
        debit: ledger.debit,
        result: ledger.result,
      })
      .from(ledger)
      .leftJoin(rounds, eq(ledger.roundId, rounds.roundId))
      .leftJoin(users, eq(users.id, ledger.userId))
      .where(eq(users.id, userId));

    // Fetch transactions from `coinsLedger`
    const coinsLedgerStatements = await db
      .select({
        date: coinsLedger.createdAt,
        type: coinsLedger.type,
        credit:
          sql`CASE WHEN ${coinsLedger.type} = 'DEPOSIT' THEN ${coinsLedger.amount} ELSE 0 END`.as(
            "credit"
          ),
        debit:
          sql`CASE WHEN ${coinsLedger.type} = 'WITHDRAWAL' THEN ${coinsLedger.amount} ELSE 0 END`.as(
            "debit"
          ),
      })
      .from(coinsLedger)
      .leftJoin(users, eq(users.id, coinsLedger.userId));

    // Merge both transactions
    let allStatements = [...ledgerStatements, ...coinsLedgerStatements];

    // Apply date filtering
    allStatements = filterDateUtils({
      data: allStatements,
      startDate,
      endDate,
    });

    // Sort transactions in **ascending** order (oldest first)
    allStatements.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Compute running balance
    let runningBalance = 0;

    const modifiedClientStatements = await Promise.all(
      allStatements.map(async (entry) => {
        let description = "";

        if (entry.roundId) {
          // const gameTypeId = getPrefixBeforeUnderscore(entry.roundId);
          const gameName = entry.roundId;
          let winOrLoss =
            entry.result === "WIN"
              ? "Win from"
              : entry.result === "LOSS"
              ? "Loss by"
              : entry.result === "BET_PLACED"
              ? "Bet Placed on"
              : "";
          description = `${winOrLoss} ${gameName}`;
        } else if (entry.type) {
          description =
            entry.type === "WITHDRAWAL"
              ? `Limit Decreased by ${entry.debit}`
              : `Limit Increased by ${entry.credit}`;
        } else {
          description = `Transaction ${entry.credit ? "Credit" : "Debit"}`;
        }

        // Update running balance
        runningBalance += (entry.credit || 0) - (entry.debit || 0);

        return {
          date: formatDate(entry.date),
          description,
          credit: entry.credit || 0,
          debit: entry.debit || 0,
          balance: runningBalance,
        };
      })
    );

    res.json({
      uniqueCode: "CGP0164",
      message: "Client statement fetched successfully",
      data: { results: modifiedClientStatements.reverse() },
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
