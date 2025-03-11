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

    // Verify if the logged-in user is an agent
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, agentUserId))
      .then((res) => res[0]);

    if (!agent) {
      return res.status(403).json({
        uniqueCode: "CGP0176",
        message: "Not authorized as an agent",
        data: {},
      });
    }

    let dbResult = await db
      .selectDistinct({
        roundId: ledger.roundId,
        gameId: games.gameId,
        date: ledger.date,
        casinoCommission: players.casinoCommission,
      })
      .from(ledger)
      .innerJoin(players, eq(ledger.userId, players.userId))
      .innerJoin(rounds, eq(ledger.roundId, rounds.roundId))
      .innerJoin(games, eq(rounds.gameId, games.id))
      .where(eq(players.userId, userId));

    // Sort transactions in ascending order (oldest first)
    dbResult.sort((a, b) => new Date(a.date) - new Date(b.date));
    let results = [];

    for (let round of dbResult) {
      let dbRoundResult = await db
        .select({
          betAmount: bets.betAmount,
          win: bets.win,
          betSide: bets.betSide,
        })
        .from(bets)
        .where(eq(bets.roundId, round.roundId));

      // Calculation for client Aspect
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
        dbResult.map(async (entry) => {
          if (entry.win) {
            const multiplier = await getBetMultiplier(
              round.gameId,
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
      const agentCommission =
        (totalBetAmount * agent.maxCasinoCommission) / 100;
      const agentPL = agentShare + agentCommission;

      const gameName = await getGameName(round.gameId); // Await the async call

      results.push({
        date: formatDate(round.date),
        roundId: round.roundId,
        roundTitle: gameName, // Ensure roundTitle is set
        roundEarning: agentShare,
        commissionEarning: agentCommission,
        totalEarning: agentPL,
      });
    }

    res.json({
      uniqueCode: "CGP0164",
      message: "Profit & loss data fetch",
      data: { results: results.reverse() },
    });
  } catch (error) {
    console.error("Error fetching client statement:", error);
    res.status(500).json({
      uniqueCode: "CGP0165",
      message: "Internal server error",
      data: {},
    });
  }
};
