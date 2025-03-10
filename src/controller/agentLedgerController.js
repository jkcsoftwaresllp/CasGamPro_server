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
} from "../database/schema.js";
import { eq, desc, sql, sum, and } from "drizzle-orm";
import { getBetMultiplier } from "../services/shared/helper/getBetMultiplier.js";

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

    // Fetch latest winning round along with game type
    const [roundData] = await db
      .select({
        roundId: rounds.roundId,
        gameType: games.gameType,
        winningBetSide: bets.betSide,
      })
      .from(rounds)
      .innerJoin(games, eq(games.id, rounds.gameId))
      .innerJoin(bets, eq(bets.roundId, rounds.roundId))
      .where(eq(bets.win, true))
      .orderBy(desc(rounds.id))
      .limit(1);

    if (!roundData) {
      return res.status(400).json({
        uniqueCode: "CGP0090",
        message: "No winning bet found for the latest round",
        data: {},
      });
    }

    const { gameType, winningBetSide } = roundData;
    const multiplier = await getBetMultiplier(gameType, winningBetSide);

    let results = [];
    let totalRecordsQuery = [];

    if (user.role === "AGENT") {
      results = await db
        .select({
          playerId: users.id,
          playerName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          entry: ledger.entry,
          betsAmount: sql`
          CASE 
            WHEN ${ledger.result} = 'BET_PLACED' 
            THEN (SELECT SUM(stakeAmount) FROM ledger WHERE results = 'BET_PLACED') 
            ELSE ${ledger.stakeAmount} 
          END
          `.as("betsAmount"),
          profitAmount: sql`
            ROUND(
              SUM(
                CASE 
                  WHEN ${ledger.result} = 'WIN' THEN 
                    ((${multiplier} * ${ledger.stakeAmount}) - ${ledger.stakeAmount})
                  ELSE 0 
                END
              ), 2
            )
          `.as("profitAmount"),

          lossAmount: sql`
            SUM(
              CASE 
                WHEN ${ledger.result} IN ('LOSE', 'BET_PLACED') THEN ${ledger.stakeAmount} 
                ELSE 0 
              END
            )
          `.as("lossAmount"),

          agentProfit: sql`
              ROUND(SUM(CASE WHEN ${ledger.result} = 'LOSE' THEN (ABS(${ledger.stakeAmount}) * 10 / 100) ELSE 0 END), 2)
            `.as("agentProfit"),

          agentLoss: sql`
              ROUND(SUM(CASE WHEN ${ledger.result} = 'WIN' THEN (ABS(${ledger.stakeAmount}) * 10 / 100) ELSE 0 END), 2)
            `.as("agentLoss"),

          superAgentProfit: sql`
              ROUND(SUM(CASE WHEN ${ledger.result} = 'LOSE' THEN (ABS(${ledger.stakeAmount}) * 90 / 100) ELSE 0 END), 2)
            `.as("superAgentProfit"),

          superAgentLoss: sql`
              ROUND(SUM(CASE WHEN ${ledger.result} = 'WIN' THEN ABS(${ledger.stakeAmount}) * 90 / 100 ELSE 0 END), 2)
            `.as("superAgentLoss"),

          agentCommission: sql`
              ROUND(SUM(ABS(${ledger.stakeAmount}) * 3 / 100), 2)
            `.as("agentCommission"),

          balance: sql`
              ROUND(
                SUM(
                  -1 * (
                    (CASE WHEN ${ledger.status} = 'WIN' THEN (ABS(${ledger.stakeAmount}) * 90 / 100) ELSE 0 END) 
                    + (ABS(${ledger.stakeAmount}) * 3 / 100)
                  )
                ), 2
              )
            `.as("balance"),

          note: ledger.result,
          date: sql`DATE(MAX(${ledger.date}))`,
        })
        .from(ledger)
        .innerJoin(users, eq(ledger.userId, users.id))
        .innerJoin(players, eq(users.id, players.userId))
        .innerJoin(bets, eq(bets.playerId, players.id))
        .innerJoin(agents, eq(players.agentId, agents.id))
        .where(eq(agents.userId, userId))
        .groupBy(
          ledger.entry,
          users.id,
          users.firstName,
          users.lastName,
          ledger.result,
          ledger.stakeAmount
        )
        .orderBy(sql`MAX(${ledger.date})`)
        .limit(recordsLimit)
        .offset(recordsOffset);

      totalRecordsQuery = await db
        .select({ count: sql`COUNT(DISTINCT ${ledger.entry})` })
        .from(ledger)
        .innerJoin(users, eq(ledger.userId, users.id))
        .innerJoin(players, eq(users.id, players.userId))
        .innerJoin(agents, eq(players.agentId, agents.id))
        .where(eq(agents.userId, userId));
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

export const createTransactionEntry = async (req, res) => {
  const {
    targetId,
    entry,
    betsAmount,
    profitAmount,
    lossAmount,
    credit,
    debit,
    commission,
    balance,
    note,
  } = req.body;

  try {
    const userId = req.session.userId;

    // Fetch user role
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({
        uniqueCode: "CGP0087",
        message: "User not found",
        data: {},
      });
    }

    let isAuthorized = false;
    if (user.role === "AGENT") {
      // Verify agent owns this player
      const [player] = await db
        .select()
        .from(players)
        .innerJoin(agents, eq(players.agentId, agents.id))
        .where(and(eq(players.userId, targetId), eq(agents.userId, userId)));

      isAuthorized = !!player;
    } else if (user.role === "SUPERAGENT") {
      // Verify super agent owns this agent
      const [agent] = await db
        .select()
        .from(agents)
        .innerJoin(superAgents, eq(agents.superAgentId, superAgents.id))
        .where(
          and(eq(agents.userId, targetId), eq(superAgents.userId, userId))
        );

      isAuthorized = !!agent;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        uniqueCode: "CGP0088",
        message: "Unauthorized: Target does not belong to this user",
        success: false,
      });
    }

    const newEntry = {
      userId: targetId,
      entry,
      amount: betsAmount,
      profitAmount,
      lossAmount,
      credit,
      debit,
      commission,
      balance,
      note,
      date: new Date(),
      stakeAmount: betsAmount,
      status: credit > 0 ? "WIN" : "LOSS",
      result: note,
    };

    // Insert transaction
    const result = await db.insert(ledger).values(newEntry);

    let response = {
      uniqueCode: "CGP0089",
      success: true,
      message: "Transaction entry created successfully",
      data: {
        results: [result],
        summary: {},
        pagination: {},
      },
    };

    logToFolderInfo(
      "Transactions/controller",
      "createTransactionEntry",
      response
    );
    return res.status(201).json(response);
  } catch (error) {
    let errorResponse = {
      uniqueCode: "CGP0090",
      success: false,
      message: "Internal Server Error",
      error: error.message,
    };

    logToFolderError(
      "Transactions/controller",
      "createTransactionEntry",
      errorResponse
    );
    return res.status(500).json(errorResponse);
  }
};
