import { db } from "../config/db.js";
import {
  ledger,
  users,
  players,
  bets,
  rounds,
  games,
  agents,
} from "../database/schema.js";
import { eq } from "drizzle-orm";
import { getBetMultiplier } from "../services/shared/helper/getBetMultiplier.js";
import { formatDate } from "../utils/formatDate.js";
import { filterUtils } from "../utils/filterUtils.js";

export const getAgentTransactions = async (req, res) => {
  try {
    const {
      limit = 30,
      offset = 0,
      startDate,
      endDate,
      userId,
      clientName,
    } = req.query;
    const userIdSession = req.session.userId;

    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    // Fetch user role
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userIdSession));

    if (!user) {
      return res.status(404).json({
        uniqueCode: "CGP0081",
        message: "User not found",
        data: {},
      });
    }

    // Fetch agent ID
    const agentRecord = await db
      .select({ agentId: agents.id })
      .from(agents)
      .where(eq(agents.userId, userIdSession))
      .limit(1);

    if (!agentRecord.length) {
      return res.status(404).json({
        uniqueCode: "CGP0082",
        message: "Agent not found",
        data: {},
      });
    }

    const agentId = agentRecord[0].agentId;
    let results = [];

    if (user.role === "AGENT") {
      const [agent] = await db
        .select({
          id: agents.id,
          maxShare: agents.maxShare,
          maxCasinoCommission: agents.maxCasinoCommission,
        })
        .from(agents)
        .where(eq(agents.userId, userIdSession));

      const ledgerResult = await db
        .selectDistinct({
          roundId: ledger.roundId,
          gameType: games.gameType,
          date: ledger.date,
        })
        .from(ledger)
        .innerJoin(players, eq(ledger.userId, players.userId))
        .innerJoin(agents, eq(players.agentId, agents.id))
        .innerJoin(rounds, eq(ledger.roundId, rounds.roundId))
        .innerJoin(games, eq(rounds.gameId, games.id))
        .where(eq(agents.userId, userIdSession));

      let balance = 0;

      for (let round of ledgerResult) {
        let dbResult = await db
          .select({
            betAmount: bets.betAmount,
            win: bets.win,
            betSide: bets.betSide,
          })
          .from(bets)
          .where(eq(bets.roundId, round.roundId));

        const totalBetAmount = dbResult.reduce(
          (sum, entry) => sum + entry.betAmount,
          0
        );

        const winningBets = dbResult.reduce(
          (sum, entry) => (entry.win ? sum + entry.betAmount : sum),
          0
        );

        const lossingBets = winningBets - totalBetAmount;

        const winningAmount = await Promise.all(
          dbResult.map(async (entry) => {
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

        const overAllHerarchi = -overallClientPL;

        const agentShare = (overAllHerarchi * agent.maxShare) / 100;
        const agentCommission =
          (totalBetAmount * agent.maxCasinoCommission) / 100;
        const agentPL = agentShare + agentCommission;

        const superAgentPL = overAllHerarchi - agentPL;
        balance += agentPL;

        results.push({
          date: formatDate(round.date),
          entry: round.roundId,
          betsAmount: totalBetAmount,
          clientPL: overallClientPL,
          agentShare: agentShare,
          superComm: agentCommission,
          agentPL: agentPL,
          superAgentPL: superAgentPL,
          balance: balance,
        });
      }
    }

    // Apply filters using filterUtils
    const filteredResults = filterUtils({
      data: results,
      startDate,
      endDate,
      userId,
      clientName,
      agentId,
    });

    return res.json({
      uniqueCode: "CGP0085",
      message: "Transactions fetched successfully",
      data: { results: filteredResults },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ message: "An error occurred", data: {} });
  }
};
