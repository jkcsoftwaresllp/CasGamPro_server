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
      const ledgerResult = await db
        .select({ roundId: ledger.roundId })
        .from(ledger)
        .innerJoin(players, eq(ledger.userId, players.userId))
        .innerJoin(agents, eq(players.agentId, agents.id))
        .where(eq(agents.userId, userId));

      const roundId = ledgerResult[0].roundId;

      let results1 = await db
        .select({
          betAmount: ledger.stakeAmount,
          result: ledger.result,
        })
        .from(ledger)
        .where(eq(ledger.roundId, roundId));

      const totalBetAmount = results1.reduce((sum, entry) => {
        return sum + entry.betAmount;
      }, 0);

      const winningBets = results1.reduce((sum, entry) => {
        return entry.result === "WIN" ? sum + entry.betAmount : 0;
      }, 0);
      console.log("Total Bet Amount:", totalBetAmount);
      console.log("Winning Bet Amount:", winningBets);
      const winningAmount = results1.reduce((sum, entry) => {
        return entry.win === 1
          ? sum +
              entry.betAmount * getBetMultiplier(entry.gameType, entry.betSide)
          : 0;
      }, 0);

      console.log("Result1", results1);
      console.log("Total Bet Amount", totalBetAmount);
      console.log("Winnging Bet Amount", winningBets);
      console.log("Winnging Bet Amount", winningAmount);
    } else if (user.role === "SUPERAGENT") {
      // Get super agent details
      const [superAgent] = await db
        .select({
          id: superAgents.id,
          maxCasinoCommission: superAgents.maxCasinoCommission,
          maxLotteryCommission: superAgents.maxLotteryCommission,
          maxSessionCommission: superAgents.maxSessionCommission,
        })
        .from(superAgents)
        .where(eq(superAgents.userId, userId));

      if (!superAgent) {
        return res.status(403).json({
          uniqueCode: "CGP0083",
          message: "Not authorized as super agent",
          data: {},
        });
      }

      // Fetch transactions for agents under this super agent
      results = await db
        .select({
          agentId: users.id,
          agentName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          entry: ledger.entry,
          betsAmount: sql`SUM(${ledger.stakeAmount})`,
          profitAmount: sql`SUM(
            CASE 
              WHEN ${ledger.status} = 'WIN' THEN -${ledger.amount} 
              WHEN ${ledger.status} = 'LOSS' THEN ${ledger.stakeAmount} 
              ELSE 0 
            END
          )`,
          lossAmount: sql`SUM(${ledger.debit})`,
          commission: sql`
            SUM(
              CASE 
                WHEN ${ledger.entry} LIKE '%casino%' THEN ${ledger.stakeAmount} * ${superAgent.maxCasinoCommission} / 100
                WHEN ${ledger.entry} LIKE '%lottery%' THEN ${ledger.stakeAmount} * ${superAgent.maxLotteryCommission} / 100
                WHEN ${ledger.entry} LIKE '%session%' THEN ${ledger.stakeAmount} * ${superAgent.maxSessionCommission} / 100
                ELSE 0 
              END
            )
          `,
          balance: sql`COALESCE(SUM(${ledger.amount}), 0)`,
          note: ledger.result,
          date: sql`DATE(MAX(${ledger.date}))`,
        })
        .from(ledger)
        .innerJoin(users, eq(ledger.userId, users.id))
        .innerJoin(agents, eq(users.id, agents.userId))
        .innerJoin(superAgents, eq(agents.superAgentId, superAgents.id))
        .where(eq(superAgents.userId, userId))
        .groupBy(
          ledger.entry,
          users.id,
          users.firstName,
          users.lastName,
          ledger.result
        )
        .orderBy(sql`MAX(${ledger.date})`)
        .limit(recordsLimit)
        .offset(recordsOffset);
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
