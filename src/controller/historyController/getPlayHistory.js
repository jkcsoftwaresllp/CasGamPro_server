import { db } from "../../config/db.js";
import { ledger, game_rounds, games } from "../../database/schema.js";
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
        date: ledger.created_at,
        roundId: ledger.round_id,
        stakeAmount: ledger.stake_amount,
        result: ledger.result,
        credit: ledger.credit,
        debit: ledger.debit,
        balance: ledger.new_balance,
      })
      .from(ledger)
      .leftJoin(game_rounds, eq(ledger.round_id, game_rounds.id));

    // Modify roundId and map it to game name
    const modifiedPlayHistory = await Promise.all(
      playHistory.map(async (entry) => {
        const gameTypeId = getPrefixBeforeUnderscore(entry.roundId);

        const gameName = await getGameName(gameTypeId);
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
      })
    );

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
