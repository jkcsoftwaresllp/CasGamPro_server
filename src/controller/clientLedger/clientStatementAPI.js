import { db } from "../../config/db.js";
import { ledger, rounds, users, coinsLedger } from "../../database/schema.js";
import { eq, sql, desc } from "drizzle-orm";
import { getGameName } from "../../utils/getGameName.js";
import { formatDate } from "../../utils/formatDate.js";

const getPrefixBeforeUnderscore = (roundId) => {
  return roundId ? roundId.split("_")[0] : "";
};

export const clientStatementAPI = async (req, res) => {
  try {
    // Fetch transactions from `ledger`
    const ledgerStatements = await db
      .select({
        date: ledger.date,
        roundId: ledger.roundId,
        credit: ledger.credit,
        debit: ledger.debit,
        result: ledger.result,
        sortId: ledger.id,
      })
      .from(ledger)
      .orderBy(desc(ledger.id))
      .leftJoin(rounds, eq(ledger.roundId, rounds.roundId))
      .leftJoin(users, eq(users.id, ledger.userId));

    // Fetch transactions from `coinsLedger`
    const coinsLedgerStatements = await db
      .select({
        date: coinsLedger.createdAt,
        type: coinsLedger.type,
        credit: sql`CASE WHEN ${coinsLedger.type} = 'DEPOSIT' THEN ABS(${coinsLedger.amount}) ELSE 0 END`,
        debit: sql`CASE WHEN ${coinsLedger.type} = 'WITHDRAWAL' THEN ABS(${coinsLedger.amount}) ELSE 0 END`,
        sortId: coinsLedger.id,
      })
      .from(coinsLedger)
      .orderBy(desc(coinsLedger.createdAt))
      .leftJoin(users, eq(users.id, coinsLedger.userId));

    // Merge and sort transactions in descending order (newest first)
    const allStatements = [...ledgerStatements, ...coinsLedgerStatements];

    allStatements.sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      return dateDiff !== 0 ? dateDiff : b.sortId - a.sortId;
    });

    // Compute real-time running balance
    let runningBalance = 0;

    const modifiedClientStatements = await Promise.all(
      allStatements.reverse().map(async (entry) => {
        let description = "";

        if (entry.roundId) {
          const gameTypeId = getPrefixBeforeUnderscore(entry.roundId);
          const gameName = await getGameName(gameTypeId);
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
          description = entry.type;
        } else {
          description = `Transaction ${entry.credit ? "Credit" : "Debit"}`;
        }

        runningBalance += (entry.credit || 0) - (entry.debit || 0);

        return {
          date: formatDate(entry.date),
          description,
          debit: entry.debit || 0,
          credit: entry.credit || 0,
          balance: runningBalance,
        };
      })
    );

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
