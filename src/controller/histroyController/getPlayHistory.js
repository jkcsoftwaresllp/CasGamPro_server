import { db } from "../../config/db.js";
import { ledger, rounds, games } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { getGameName } from "../../utils/getGameName.js";

const getPrefixBeforeUnderscore = (roundId) => {
  return roundId.split("_")[0];
};

export const getPlayHistory = async (req, res) => {
  try {
    const playHistory = await db
      .select({
        roundId: ledger.roundId,
        stakeAmount: ledger.stakeAmount,
        result: ledger.result,
      })
      .from(ledger)
      .leftJoin(rounds, eq(ledger.roundId, rounds.id));

    // Modify roundId and map it to game name
    const modifiedPlayHistory = playHistory.map((entry) => {
      const gameTypeId = getPrefixBeforeUnderscore(entry.roundId);
      return {
        ...entry,
        gameName: getGameName(gameTypeId),
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
