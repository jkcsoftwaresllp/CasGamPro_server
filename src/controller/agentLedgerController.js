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

        results.push({
          date: round.date,
          entry: round.roundId,
          betsAmount: totalBetAmount,
          clientPL: overallClientPL,
          agentShare: agentShare,
          superComm: agentCommission,
          agentPL: agentPL,
          supeerAgentPL: supperAgentPL,
          balance: "",
        });

        console.log(`\n------------------ ${round.roundId} ----------------`);
        console.log("Bet Amount: ", totalBetAmount, winningBets, lossingBets);
        console.log("Winnging Bet Amount: ", winningAmount);
        console.log("Client P/L: ", clientProfit, overallClientPL);
        console.log("\nOver all herarchi: ", overAllHerarchi);
        console.log("Agent P/L: ", agentShare, agentCommission, agentPL);
        console.log("Herarchi: ", agentPL, supperAgentPL);
      }

      // const rawLedgerResult = await db
      //   .select({
      //     roundId: ledger.roundId,
      //     betAmounts: sql`GROUP_CONCAT(${ledger.stakeAmount})`.as("betAmounts"),
      //     results: sql`GROUP_CONCAT(${ledger.result})`.as("results"),
      //   })
      //   .from(ledger)
      //   .innerJoin(players, eq(ledger.userId, players.userId))
      //   .innerJoin(agents, eq(players.agentId, agents.id))
      //   .where(eq(agents.userId, userId))
      //   .groupBy(ledger.roundId);

      // // Convert string values to arrays in JavaScript
      // const ledgerResult = rawLedgerResult.map((entry) => ({
      //   roundId: entry.roundId,
      //   betAmounts: entry.betAmounts.split(",").map(Number), // Convert to array of numbers
      //   results: entry.results.split(","), // Convert to array of strings
      // }));

      // for (let ledger of ledgerResult) {
      //   const { roundId, betAmounts, results } = ledger;

      //   const totalBets = betAmounts.length;

      //   console.log(totalBets);
      //   for (let i = 0; i < totalBets; i++) {

      // }
      // }
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
