import { db } from "../config/db.js";
import { ledger, users, players, agents } from "../database/schema.js";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { logToFolderError, logToFolderInfo } from "../utils/logToFolder.js";
import { filterUtils } from "../utils/filterUtils.js";

export const getAgentTransactions = async (req, res) => {
  try {
    const { limit = 30, offset = 0 } = req.query;
    const agentId = req.session.userId;

    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    const conditions = filterUtils(req.query);

    const [agent] = await db
      .select({
        maxCasinoCommission: agents.maxCasinoCommission,
        maxLotteryCommission: agents.maxLotteryCommission,
        maxSessionCommission: agents.maxSessionCommission,
      })
      .from(agents)
      .where(eq(agents.userId, agentId));

    const results = await db
      .select({
        agentId: users.id,
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
        credit: sql`SUM(${ledger.credit})`,
        debit: sql`SUM(${ledger.debit})`,
        agentCommission: sql`SUM(
          CASE 
            WHEN ${ledger.entry} LIKE '%casino%' THEN ${ledger.stakeAmount} * ${agent.maxCasinoCommission} / 100
            WHEN ${ledger.entry} LIKE '%lottery%' THEN ${ledger.stakeAmount} * ${agent.maxLotteryCommission} / 100
            WHEN ${ledger.entry} LIKE '%session%' THEN ${ledger.stakeAmount} * ${agent.maxSessionCommission} / 100
            ELSE 0 
          END
        )`,
        balance: sql`COALESCE(SUM(${ledger.amount}), 0)`,

        note: ledger.result,
        date: sql`MAX(${ledger.date})`,
      })
      .from(ledger)
      .innerJoin(users, eq(ledger.userId, users.id))
      .innerJoin(players, eq(users.id, players.userId))
      .innerJoin(agents, eq(players.agentId, agents.id))
      .where(and(eq(agents.userId, agentId), ...conditions))
      .groupBy(ledger.entry, users.id, ledger.result)
      .orderBy(sql`MAX(${ledger.date})`)
      .limit(recordsLimit)
      .offset(recordsOffset);

    // Fetch total record count
    //
    const totalRecords = [0]; // TODO : Fix Dummy Data
    // const totalRecords = await db
    //   .select({ count: sql`COUNT(*)` })
    //   .from(ledger)
    //   .innerJoin(users, eq(ledger.userId, users.id))
    //   .innerJoin(players, eq(users.id, players.userId))
    //   .where(and(eq(agents.userId, agentId), ...conditions));

    const nextOffset =
      recordsOffset + recordsLimit < totalRecords[0].count
        ? recordsOffset + recordsLimit
        : null;

    let response = {
      uniqueCode: "CGP0081",
      success: true,
      message: "Agent transactions fetched successfully",
      data: {
        results,
        pagination: {
          totalRecords: totalRecords[0].count,
          nextOffset,
        },
      },
    };

    logToFolderInfo(
      "Transactions/controller",
      "getAgentTransactions",
      response
    );
    return res.json(response);
  } catch (error) {
    console.log(error);
    let errorResponse = {
      uniqueCode: "CGP0082",
      success: false,
      message: "Internal Server Error",
      error: error.message,
    };

    logToFolderError(
      "Transactions/controller",
      "getAgentTransactions",
      errorResponse
    );
    return res.status(500).json(errorResponse);
  }
};

export const createTransactionEntry = async (req, res) => {
  const {
    agentId,
    playerId,
    entry,
    betsAmount,
    profitAmount,
    lossAmount,
    credit,
    debit,
    agentCommission,
    balance,
    note,
  } = req.body;

  try {
    const agentId = req.session.userId;

    // Verify agent owns this player
    const [player] = await db
      .select()
      .from(players)
      .innerJoin(agents, eq(players.agentId, agents.id))
      .where(and(eq(players.id, playerId), eq(agents.userId, agentId)));

    if (!player) {
      return res.status(403).json({
        uniqueCode: "CGP0083",
        message: "Unauthorized: Player does not belong to this agent",
        success: false,
      });
    }

    const newEntry = {
      agentId,
      userId: playerId,
      entry,
      amount: betsAmount,
      profitAmount,
      lossAmount,
      credit,
      debit,
      agentCommission,
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
      uniqueCode: "CGP0083",
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
      uniqueCode: "CGP0084",
      success: false,
      message: "Internal Server Error",
      error: error.message,
    };

    logToFolderError(
      "Transactions/controller",
      "createTransactionEntry",
      errorResponse
    );
    console.error("Error creating transaction entry:", error);
    return res.status(500).json(errorResponse);
  }
};
