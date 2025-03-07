import { db } from '../../config/db.js';
import { ledger, users, agents, superAgents } from '../../database/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { logToFolderError, logToFolderInfo } from '../../utils/logToFolder.js';
import { filterUtils } from '../../utils/filterUtils.js';

export const getAgentTransactions = async (req, res) => {
  try {
    const { limit = 30, offset = 0 } = req.query;
    const superAgentId = req.session.userId;

    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    const conditions = filterUtils(req.query);

    const [superAgent] = await db
      .select({
        maxCasinoCommission: agents.maxCasinoCommission,
        maxLotteryCommission: agents.maxLotteryCommission,
        maxSessionCommission: agents.maxSessionCommission,
      })
      .from(superAgents)
      .where(eq(superAgents.userId, superAgentId));

    const results = await db
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
        credit: sql`SUM(${ledger.credit})`,
        debit: sql`SUM(${ledger.debit})`,
        agentCommission: sql`SUM(
          CASE 
            WHEN ${ledger.entry} LIKE '%casino%' THEN ${ledger.stakeAmount} * ${superAgent.maxCasinoCommission} / 100
            WHEN ${ledger.entry} LIKE '%lottery%' THEN ${ledger.stakeAmount} * ${superAgent.maxLotteryCommission} / 100
            WHEN ${ledger.entry} LIKE '%session%' THEN ${ledger.stakeAmount} * ${superAgent.maxSessionCommission} / 100
            ELSE 0 
          END
        )`,
        balance: sql`COALESCE(SUM(${ledger.amount}), 0)`,
        note: ledger.result,
        date: sql`MAX(${ledger.date})`,
      })
      .from(ledger)
      .innerJoin(users, eq(ledger.userId, users.id))
      .innerJoin(agents, eq(users.id, agents.userId))
      .innerJoin(superAgents, eq(agents.superAgentId, superAgents.id))
      .where(and(eq(superAgents.userId, superAgentId), ...conditions))
      .groupBy(ledger.entry, users.id, users.firstName, users.lastName, ledger.result)
      .orderBy(sql`MAX(${ledger.date})`)
      .limit(recordsLimit)
      .offset(recordsOffset);

    const [totalRecords] = await db
      .select({ count: sql`COUNT(DISTINCT ${ledger.entry})` })
      .from(ledger)
      .innerJoin(users, eq(ledger.userId, users.id))
      .innerJoin(agents, eq(users.id, agents.userId))
      .innerJoin(superAgents, eq(agents.superAgentId, superAgents.id))
      .where(and(eq(superAgents.userId, superAgentId), ...conditions));

    const nextOffset =
      recordsOffset + recordsLimit < totalRecords.count
        ? recordsOffset + recordsLimit
        : null;

    let response = {
      uniqueCode: 'CGP0194',
      message: 'Agent transactions fetched successfully',
      data: {
        results,
        pagination: {
          totalRecords: totalRecords.count,
          nextOffset,
        },
      },
    };

    logToFolderInfo(
      'SuperAgent/controller',
      'getAgentTransactions',
      response
    );
    return res.json(response);
  } catch (error) {
    let errorResponse = {
      uniqueCode: 'CGP0195',
      message: 'Internal Server Error',
      error: error.message,
    };

    logToFolderError(
      'SuperAgent/controller',
      'getAgentTransactions',
      errorResponse
    );
    return res.status(500).json(errorResponse);
  }
};

export const createAgentTransactionEntry = async (req, res) => {
  const {
    agentId,
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
    const superAgentId = req.session.userId;

    // Verify super agent owns this agent
    const [agent] = await db
      .select()
      .from(agents)
      .innerJoin(superAgents, eq(agents.superAgentId, superAgents.id))
      .where(and(eq(agents.userId, agentId), eq(superAgents.userId, superAgentId)));

    if (!agent) {
      return res.status(403).json({
        uniqueCode: 'CGP0196',
        message: 'Unauthorized: Agent does not belong to this super agent',
        success: false,
      });
    }

    const newEntry = {
      userId: agentId,
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
      status: credit > 0 ? 'WIN' : 'LOSS',
      result: note,
    };

    // Insert transaction
    const result = await db.insert(ledger).values(newEntry);

    let response = {
      uniqueCode: 'CGP0197',
      success: true,
      message: 'Transaction entry created successfully',
      data: {
        results: [result],
        summary: {},
        pagination: {},
      },
    };

    logToFolderInfo(
      'SuperAgent/controller',
      'createAgentTransactionEntry',
      response
    );
    return res.status(201).json(response);
  } catch (error) {
    let errorResponse = {
      uniqueCode: 'CGP0198',
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    };

    logToFolderError(
      'SuperAgent/controller',
      'createAgentTransactionEntry',
      errorResponse
    );
    return res.status(500).json(errorResponse);
  }
};