import { db } from "../config/db.js";
import { game_bets, game_rounds, users } from "../database/schema.js";
import { eq, and, sql } from "drizzle-orm";
import { createResponse } from "../helper/responseHelper.js";
import { getGameName } from "../utils/getGameName.js";

export const exposureController = async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(400).json(
        createResponse("CGP0022", "User ID is required")
      );
    }

    // Get all unsettled bets for the user
    const unsettledBets = await db
      .select({
        roundId: game_rounds.id,
        gameId: game_rounds.game_id,
        betAmount: game_bets.bet_amount,
        betSide: game_bets.bet_side,
        winAmount: game_bets.win_amount,
      })
      .from(game_bets)
      .innerJoin(game_rounds, eq(game_bets.round_id, game_rounds.id))
      .where(
        and(
          eq(game_bets.user_id, userId),
          sql`${game_bets.win_amount} IS NULL`
        )
      );

    if (!unsettledBets.length) {
      return res.json(
        createResponse("CGP0023", "All bets settled", { results: [] })
      );
    }

    // Format response with game names
    const formattedBets = await Promise.all(
      unsettledBets.map(async (bet) => ({
        matchName: await getGameName(bet.gameId),
        marketFancyName: `Pending bets for (${await getGameName(bet.gameId)})`,
        exposure: parseFloat(bet.betAmount),
      }))
    );

    return res.json(
      createResponse("CGP0024", "Unsettled bets found", {
        results: formattedBets,
      })
    );

  } catch (error) {
    console.error("Exposure controller error:", error);
    return res.status(500).json(
      createResponse("CGP0025", "Internal Server Error", {
        error: error.message,
      })
    );
  }
};