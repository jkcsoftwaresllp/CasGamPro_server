import { db } from "../../config/db.js";
import { ledger, rounds, users, coinsLedger } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { getGameName } from "../../utils/getGameName.js";
import { formatDate } from "../../utils/formatDate.js";

const getPrefixBeforeUnderscore = (roundId) => {
  return roundId ? roundId.split("_")[0] : "";
};

export const clientStatementAPI = async (req, res) => {
  try {
    const ledgerStatements = await db
      .select({
        date: ledger.date,
        roundId: ledger.roundId,
        credit: ledger.credit,
        debit: ledger.debit,
        balance: ledger.balance,
        result: ledger.result,
      })
      .from(ledger)
      .leftJoin(rounds, eq(ledger.roundId, rounds.roundId))
      .leftJoin(users, eq(users.id, ledger.userId));

    // Fetch from `coinsLedger`
    const coinsLedgerStatements = await db
      .select({
        date: coinsLedger.createdAt,
        type: coinsLedger.type,
        credit: coinsLedger.type === "CREDIT" ? coinsLedger.amount : 0,
        debit: coinsLedger.type === "DEBIT" ? coinsLedger.amount : 0,
        balance: coinsLedger.newBalance,
      })
      .from(coinsLedger)
      .leftJoin(users, eq(users.id, coinsLedger.userId));

    // Merge and sort all statements by date (descending)
    const allStatements = [...ledgerStatements, ...coinsLedgerStatements];
    allStatements.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Process each statement
    const modifiedClientStatements = allStatements.map((entry) => {
      let description = "";

      if (entry.roundId) {
        // Entry is from `ledger`
        const gameTypeId = getPrefixBeforeUnderscore(entry.roundId);
        const gameName = getGameName(gameTypeId);
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

      return {
        date: formatDate(entry.date),
        description,
        credit: entry.credit || 0,
        debit: entry.debit || 0,
        balance: entry.balance,
      };
    });

    res.json({
      uniqueCode: "CGP0164",
      message: "Client statement fetched successfully",
      data: { results: modifiedClientStatements },
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
