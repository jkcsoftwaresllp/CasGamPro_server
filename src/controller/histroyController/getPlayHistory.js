import { db } from "../../config/db.js";
import { ledger, rounds, games } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { getGameName } from "../../utils/getGameName.js";
import { formatDate } from "../../utils/formatDate.js";

const getPrefixBeforeUnderscore = (roundId) => {
  return roundId.split("_")[0];
};
const getLastFourDigits = (roundId) => {
  return roundId.slice(-4);
};
export const getPlayHistory = async (req, res) => {
  try {
    const playHistory = await db
      .select({
        date: ledger.date,
        roundId: ledger.roundId,
        stakeAmount: ledger.stakeAmount,
        result: ledger.result,
        credit: ledger.credit,
        debit: ledger.debit,
        balance: ledger.balance,
      })
      .from(ledger)
      .leftJoin(rounds, eq(ledger.roundId, rounds.roundId));

    // Modify roundId and map it to game name
    const modifiedPlayHistory = playHistory.map((entry) => {
      const gameTypeId = getPrefixBeforeUnderscore(entry.roundId);

      const gameName = getGameName(gameTypeId);
      const roundLastFour = getLastFourDigits(entry.roundId);
      const description = `${
        entry.result === "WIN" ? "Win" : "Loss"
      } in ${gameName} (Round: ${roundLastFour})`;

      return {
        date: formatDate(entry.date),
        description,
        profit: entry.result === "WIN" ? entry.credit : 0,
        loss: entry.result === "LOSE" ? entry.debit : 0,
        balance: entry.balance,
      };
    });

    res.json({
      uniqueCode: "CGP0115",
      message: "Play history fetched successfully",
      data: { results: modifiedPlayHistory },
    });
  } catch (error) {
    console.error("Error fetching play history:", error);
    res.status(500).json({
      uniqueCode: "CGP0116",
      message: "Internal server error",
      data: {},
    });
  }
};
