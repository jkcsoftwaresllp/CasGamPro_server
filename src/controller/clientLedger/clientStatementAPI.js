import { db } from "../../config/db.js";
import { ledger, rounds, users } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { getGameName } from "../../utils/getGameName.js";
import { formatDate } from "./../../utils/formatDate.js";

const getPrefixBeforeUnderscore = (roundId) => {
  return roundId.split("_")[0];
};

const getLastFourDigits = (roundId) => {
  return roundId.slice(-4);
};

export const clientStatementAPI = async (req, res) => {
  try {
    const clientStatements = await db
      .select({
        date: ledger.date,
        roundId: ledger.roundId,
        credit: ledger.credit,
        debit: ledger.debit,
        balance: ledger.balance,
        userId: users.id,
        result: ledger.result,
      })
      .from(ledger)
      .leftJoin(rounds, eq(ledger.roundId, rounds.roundId))
      .leftJoin(users, eq(users.id, ledger.userId));

    clientStatements.sort((a, b) => new Date(b.date) - new Date(a.date));

    const modifiedClientStatements = clientStatements.map((entry) => {
      const gameTypeId = getPrefixBeforeUnderscore(entry.roundId);
      const gameName = getGameName(gameTypeId);
      const roundLastFour = getLastFourDigits(entry.roundId);
      const clientId = entry.userId;

      // Determine win/loss based on schema
      let winOrLoss = entry.result === "WIN" ? "Win" : "Loss";

      // Dynamic Description Logic
      let description;
      if (entry.debit) {
        description = `${winOrLoss} in ${gameName} (Round: ${roundLastFour})`;
      } else if (entry.credit) {
        if (entry.roundId) {
          description = `${winOrLoss} in ${gameName} (Round: ${roundLastFour})`;
        } else {
          description = `Limit increased (of Client ID: ${clientId}) by adding (${entry.credit})`;
        }
      } else {
        description = "Transaction recorded";
      }

      return {
        date: formatDate(entry.date),
        description,
        credit: entry.credit || 0,
        debit: entry.debit || 0,
        commPositive: 0, // TODO
        commNegative: 0, // TODO
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
