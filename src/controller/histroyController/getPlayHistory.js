import { db } from "../../config/db.js";
import { ledger, rounds, games } from "../../database/schema.js";
import { eq } from "drizzle-orm";

export const getPlayHistory = async (req, res) => {
  try {
    const playHistory = await db
      .select({
        gameName: games.name,
        roundId: ledger.roundId,
        stakeAmount: ledger.stakeAmount,
        result: ledger.result,
      })
      .from(ledger)
      .leftJoin(rounds, eq(ledger.roundId, rounds.id))
      .leftJoin(games, eq(rounds.gameId, games.id));

    res.json({
      uniqueCode: "CGP0115",
      message: "Play history fetched successfully",
      data: playHistory,
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
