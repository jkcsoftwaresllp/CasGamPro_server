import { db } from "../../config/db.js";
import {
  ledger,
  rounds,
  agents,
  players,
  bets,
  games,
} from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { getGameName } from "../../utils/getGameName.js";
import { formatDate } from "../../utils/formatDate.js";
import { getBetMultiplier } from "../../services/shared/helper/getBetMultiplier.js";

// Utility to fetch agent details
const getAgent = async (agentUserId) => {
  return db
    .select()
    .from(agents)
    .where(eq(agents.userId, agentUserId))
    .then((res) => res[0]);
};

// Fetch player transactions (rounds played)
const getPlayerRounds = async (userId) => {
  return db
    .selectDistinct({
      roundId: ledger.roundId,
      gameId: games.gameId,
      gameType: games.gameType,
      date: ledger.date,
      casinoCommission: players.casinoCommission,
    })
    .from(ledger)
    .innerJoin(players, eq(ledger.userId, players.userId))
    .innerJoin(rounds, eq(ledger.roundId, rounds.roundId))
    .innerJoin(games, eq(rounds.gameId, games.id))
    .where(eq(players.userId, userId));
};

// Fetch details for a specific round
const getRoundDetails = async (roundId) => {
  return db
    .select({
      betAmount: bets.betAmount,
      win: bets.win,
      betSide: bets.betSide,
    })
    .from(bets)
    .where(eq(bets.roundId, roundId));
};

// Compute Profit/Loss calculations
const calculatePL = async (round, dbRoundResult, agent) => {
  const totalBetAmount = dbRoundResult.reduce(
    (sum, entry) => sum + entry.betAmount,
    0
  );
  const winningBets = dbRoundResult.reduce(
    (sum, entry) => (entry.win ? sum + entry.betAmount : sum),
    0
  );
  const lossingBets = winningBets - totalBetAmount;

  const winningAmount = await Promise.all(
    dbRoundResult.map(async (entry) => {
      if (entry.win) {
        const multiplier = await getBetMultiplier(
          round.gameType,
          entry.betSide
        );
        return entry.betAmount * multiplier;
      }
      return 0;
    })
  ).then((values) => values.reduce((sum, val) => sum + val, 0));

  const clientProfit = winningAmount - winningBets;
  const overallClientPL = clientProfit + lossingBets;

  // Hierarchy Calculations
  const overAllHierarchy = -overallClientPL;
  const agentShare = (overAllHierarchy * agent.maxShare) / 100;
  const agentCommission = (totalBetAmount * agent.maxCasinoCommission) / 100;
  const agentPL = agentShare + agentCommission;

  // console.log(`\n------------------ ${round.roundId} ----------------`);
  // console.log("Bet Amount: ", totalBetAmount, winningBets, lossingBets);
  // console.log("Winnging Bet Amount: ", winningAmount);
  // console.log("Client P/L: ", clientProfit, overallClientPL);
  // console.log("\nOver all herarchi: ", overAllHierarchy);
  // console.log("Agent P/L: ", agentShare, agentCommission, agentPL);

  return {
    roundEarning: agentShare,
    commissionEarning: agentCommission,
    totalEarning: agentPL,
    overallClientPL: overallClientPL
  };
};

/**
 * **Reusable Function:** Fetches client P/L data and returns the results array.
 * This can be used in multiple APIs for different calculations.
 */
export const getClientPLData = async (userId, agentUserId) => {
  const agent = await getAgent(agentUserId);
  if (!agent) {
    throw new Error("Not authorized as an agent");
  }

  let dbResult = await getPlayerRounds(userId);
  dbResult.sort((a, b) => new Date(a.date) - new Date(b.date));

  const results = await Promise.all(
    dbResult.map(async (round) => {
      const dbRoundResult = await getRoundDetails(round.roundId);
      const plData = await calculatePL(round, dbRoundResult, agent);
      const gameName = await getGameName(round.gameId);

      return {
        date: formatDate(round.date),
        roundId: round.roundId,
        roundTitle: gameName,
        ...plData,
      };
    })
  );

  return results.reverse();
};

/**
 * **API Handler:** Calls `getClientPLData` and returns the response.
 */
export const clientPL_API = async (req, res) => {
  try {
    const agentUserId = req.session.userId;
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        uniqueCode: "CGP0175",
        message: "User ID is required",
        data: {},
      });
    }

    const results = await getClientPLData(userId, agentUserId);

    res.json({
      uniqueCode: "CGP0164",
      message: "Profit & loss data fetched",
      data: { results },
    });
  } catch (error) {
    console.error("Error fetching client statement:", error);
    res.status(500).json({
      uniqueCode: "CGP0165",
      message: error.message || "Internal server error",
      data: {},
    });
  }
};
