import { db } from "../../config/db.js";
import {
  ledger,
  game_bets,
  game_rounds,
  games,
  users,
  user_limits_commissions,
} from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { getGameName } from "../../utils/getGameName.js";
import { formatDate } from "../../utils/formatDate.js";
import { getBetMultiplier } from "../../services/shared/helper/getBetMultiplier.js";

// Utility to fetch agent details
const getAgent = async (agentUserId) => {
  return db
    .select()
    .from(users)
    .where(eq(users.id, agentUserId))
    .then((res) => res[0]);
};

// Fetch player transactions (rounds played)
const getPlayerRounds = async (userId) => {
  return db
    .selectDistinct({
      roundId: ledger.round_id,
      gameId: games.id,
      gameType: games.gameType,
      date: ledger.created_at,
      casinoCommission: users.balance, // Adjust this as needed
    })
    .from(ledger)
    .innerJoin(users, eq(ledger.user_id, users.id))
    .innerJoin(game_rounds, eq(ledger.round_id, game_rounds.id))
    .innerJoin(games, eq(game_rounds.game_id, games.id))
    .where(eq(users.id, userId));
};

// Fetch details for a specific round
const getRoundDetails = async (roundId) => {
  return db
    .select({
      betAmount: game_bets.bet_amount,
      win: game_bets.win_amount,
      betSide: game_bets.bet_side,
    })
    .from(game_bets)
    .where(eq(game_bets.round_id, roundId));
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

  // Fetch the commission data for the agent
  const agentCommissionData = await db
    .select()
    .from(user_limits_commissions)
    .where(eq(user_limits_commissions.user_id, agentUserId))
    .then((res) => res[0]);

  let dbResult = await getPlayerRounds(userId);
  dbResult.sort((a, b) => new Date(a.date) - new Date(b.date));

  const results = await Promise.all(
    dbResult.map(async (round) => {
      const dbRoundResult = await getRoundDetails(round.roundId);
      const plData = await calculatePL(round, dbRoundResult, agentCommissionData);
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
