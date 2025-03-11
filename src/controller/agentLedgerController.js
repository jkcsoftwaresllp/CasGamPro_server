import { db } from "../config/db.js";
import {
  ledger,
  users,
  players,
  bets,
  rounds,
  games,
  agents,
  superAgents,
  multipliers,
} from "../database/schema.js";
import { eq, desc, sql, sum, and } from "drizzle-orm";
import { getBetMultiplier } from "../services/shared/helper/getBetMultiplier.js";
import { date } from "drizzle-orm/mysql-core";
import { formatDate } from "../utils/formatDate.js";

export const getAgentTransactions = async (req, res) => {
  try {
    const { limit = 30, offset = 0 } = req.query;
    const userId = req.session.userId;

    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    // Fetch user role
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

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
      .where(eq(agents.userId, userId))
      .limit(1);

    const agentt = agentRecord[0].agentId;

    let results = [];

    if (user.role === "AGENT") {
      const [agent] = await db
        .select({
          id: agents.id,
          maxShare: agents.maxShare,
          maxCasinoCommission: agents.maxCasinoCommission,
        })
        .from(agents)
        .where(eq(agents.userId, userId));

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
        .where(eq(agents.userId, userId));

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

        // Calculation for client Aspect

        const totalBetAmount = dbResult.reduce((sum, entry) => {
          return sum + entry.betAmount;
        }, 0);

        const winningBets = dbResult.reduce((sum, entry) => {
          return entry.win ? sum + entry.betAmount : sum;
        }, 0);

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

        // Herarchi -----------------------------------
        const overAllHerarchi = -overallClientPL;

        // Calculation for Agent Aspect
        const agentShare = (overAllHerarchi * agent.maxShare) / 100;
        const agentCommission =
          (totalBetAmount * agent.maxCasinoCommission) / 100;
        const agentPL = agentShare + agentCommission;

        const supperAgentPL = overAllHerarchi - agentPL;
        balance = balance + agentPL;

        results.push({
          date: formatDate(round.date),
          entry: round.roundId,
          betsAmount: totalBetAmount,
          clientPL: overallClientPL,
          agentShare: agentShare,
          superComm: agentCommission,
          agentPL: agentPL,
          supeerAgentPL: supperAgentPL,
          balance: balance,
        });

        // console.log(`\n------------------ ${round.roundId} ----------------`);
        // console.log("Bet Amount: ", totalBetAmount, winningBets, lossingBets);
        // console.log("Winnging Bet Amount: ", winningAmount);
        // console.log("Client P/L: ", clientProfit, overallClientPL);
        // console.log("\nOver all herarchi: ", overAllHerarchi);
        // console.log("Agent P/L: ", agentShare, agentCommission, agentPL);
        // console.log("Herarchi: ", agentPL, supperAgentPL);
      }
    }

    return res.json({
      uniqueCode: "CGP0085",
      message: "Transactions fetched successfully",
      data: { results },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ message: "An error occurred", data: {} });
  }
};
