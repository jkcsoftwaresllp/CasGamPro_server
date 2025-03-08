import { db } from "../config/db.js";
import { bets, players } from "../database/schema.js";
import { eq, desc } from "drizzle-orm";
import { logToFolderError } from "../utils/logToFolder.js";
import { getGameName } from "../utils/getGameName.js";

const getPrefixBeforeUnderscore = (roundId) => {
  return roundId ? roundId.split("_")[0] : "";
};

export const exposureController = async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(400).json({
        uniqueCode: "CGP0053",
        message: "User ID is required",
        data: {},
      });
    }

    await db.transaction(async (trx) => {
      // Fetch playerId from players table
      const playerResult = await trx
        .select({ playerId: players.id })
        .from(players)
        .where(eq(players.userId, userId))
        .limit(1);

      // Check if playerResult is empty
      if (!playerResult || playerResult.length === 0) {
        return res.json({
          uniqueCode: "CGP0058",
          message: "User not found in players table",
          data: {},
        });
      }

      const playerId = playerResult[0].playerId;
      // Fetch latest bets for each roundId
      const latestBets = await trx
        .select({
          betId: bets.id,
          roundId: bets.roundId,
          fancyName: bets.betSide,
          betAmount: bets.betAmount,
          winStatus: bets.win,
        })
        .from(bets)
        .where(eq(bets.playerId, playerId))
        .orderBy(bets.roundId, desc(bets.id));

      // Ensure latestBets is an array before filtering
      if (!latestBets || latestBets.length === 0) {
        return res.json({
          uniqueCode: "CGP0058",
          message: "No bets found for the user",
          data: {},
        });
      }

      // Filter bets: Keep only unsettled (winStatus NULL or FALSE)
      const unsettledBets = latestBets
        .filter((bet, index, self) => {
          const isLastEntry =
            self.findIndex((b) => b.roundId === bet.roundId) === index;
          return (
            isLastEntry && (bet.winStatus === null || bet.winStatus === false)
          );
        })
        .map((bet) => {
          const gameTypeId = getPrefixBeforeUnderscore(bet.roundId);
          const gameName = getGameName(gameTypeId);
          return {
            roundId: bet.roundId,
            fancyName: bet.fancyName,
            betAmount: bet.betAmount,
            gameName,
          };
        });

      if (unsettledBets.length > 0) {
        return res.json({
          uniqueCode: "CGP0059",
          message: "Unsettled bets found",
          data: { unsettledBets },
        });
      } else {
        return res.json({
          uniqueCode: "CGP0060",
          message: "All bets settled successfully",
          data: [],
        });
      }
    });
  } catch (error) {
    let tempError = {
      uniqueCode: "CGP0055",
      message: "Internal Server Error",
      data: { error: error.message },
    };

    logToFolderError("Exposure/controller", "exposureController", tempError);
    return res.status(500).json(tempError);
  }
};
