import { db } from "../config/db.js";
import { bets, rounds, games } from "../database/schema.js";
import { eq, and, isNull } from "drizzle-orm";

export const exposureController = async (req, res) => {
  const { userId } = req.params;
  console.log(`Fetching exposure for user: ${userId}`);
  try {
    if (!userId) {
      return res.status(400).json({
        uniqueCode: "CGP0053",
        message: "User ID is required",
        data: {},
      });
    }
    const unsettledBets = await db
      .select({
        matchName: games.name,
        roundId: rounds.id,
        marketName: bets.betSide,
        exposureAmount: bets.betAmount,
      })
      .from(bets)
      .innerJoin(rounds, eq(bets.roundId, rounds.id))
      .innerJoin(games, eq(rounds.gameId, games.id))
      .where(and(eq(bets.playerId, userId), isNull(bets.win)))
      .orderBy(rounds.createdAt);

    // If no unsettled bets exist, return a message
    if (unsettledBets.length === 0) {
      return res.json({
        uniqueCode: "CGP0056",
        message: "All bets are settled already",
        data: {},
      });
    }

    return res.json({
      uniqueCode: "CGP0054",
      message: "Exposure data fetched successfully",
      data: { unsettledBets },
    });
  } catch (error) {
    console.error("Error fetching exposure data:", error);
    return res.status(500).json({
      uniqueCode: "CGP0055",
      message: "Internal Server Error",
      data: {},
    });
  }
};
