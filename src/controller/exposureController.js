import { db } from "../config/db.js";
import { bets, players, rounds } from "../database/schema.js";
import { eq, desc, sql } from "drizzle-orm";
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

      // Fetch roundIds where win === 1 (settled bets)
      const winningRoundIds = await trx
        .select({ roundId: bets.roundId })
        .from(bets)
        .where(eq(bets.win, 1));

      const winningRoundIdList = winningRoundIds.map((bet) => bet.roundId);

      const roundsExistIds = await trx
        .select({ roundId: rounds.roundId })
        .from(rounds);
      const roundsExistIdList = roundsExistIds.map((round) => round.roundId);

      // Step 3: Combine both lists to filter out unwanted rounds
      const roundIdsToExclude = new Set([
        ...winningRoundIdList,
        ...roundsExistIdList,
      ]);

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
        .where(sql`${bets.win} IS NULL OR ${bets.win} = FALSE`) // Only unsettled bets
        .where(
          sql`${bets.roundId} NOT IN (${sql.join(
            [...roundIdsToExclude],
            sql`, `
          )})`
        ) // Exclude rounds
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
      const unsettledBets = await Promise.all(
        latestBets
          .filter((bet, index, self) => {
            const isLastEntry =
              self.findIndex((b) => b.roundId === bet.roundId) === index;
            return (
              isLastEntry &&
              (bet.winStatus === null ||
                bet.winStatus === false ||
                bet.winStatus === 1)
            );
          })
          .map(async (bet) => {
            const gameTypeId = getPrefixBeforeUnderscore(bet.roundId);
            const gameName = await getGameName(gameTypeId);
            return {
              matchName: gameName,
              marketFancyName: bet.fancyName,
              exposure: bet.betAmount,
            };
          })
      );

      if (unsettledBets.length > 0) {
        return res.json({
          uniqueCode: "CGP0059",
          message: "Unsettled bets found",
          data: {
            results: unsettledBets,
          },
        });
      } else {
        return res.json({
          uniqueCode: "CGP0060",
          message: "All bets settled successfully",
          data: {
            results: [],
          },
        });
      }
    });
  } catch (error) {
    console.log(error);
    let tempError = {
      uniqueCode: "CGP0055",
      message: "Internal Server Error",
      data: { error: error.message },
    };

    logToFolderError("Exposure/controller", "exposureController", tempError);
    return res.status(500).json(tempError);
  }
};
