import { db } from '../config/db.js';
import { ledger, users, agents, players, superAgents } from '../database/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { logToFolderError, logToFolderInfo } from '../utils/logToFolder.js';
import { filterUtils } from '../utils/filterUtils.js';

export const getAgentTransactions = async (req, res) => {
  try {
    const { limit = 30, offset = 0 } = req.query;
    const userId = req.session.userId;

    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    const conditions = filterUtils(req.query);

    // Fetch user role
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({
        uniqueCode: 'CGP0081',
        message: 'User not found',
        data: {},
      });
    }

    let results = [];
    let totalRecordsQuery = [];

    if (user.role === 'AGENT') {
      // Get agent's ID and commission rates
      const [agent] = await db
        .select({
          id: agents.id,
          maxCasinoCommission: agents.maxCasinoCommission,
          maxLotteryCommission: agents.maxLotteryCommission,
          maxSessionCommission: agents.maxSessionCommission,
        })
        .from(agents)
        .where(eq(agents.userId, userId));

      if (!agent) {
        return res.status(403).json({
          uniqueCode: 'CGP0082',
          message: 'Not authorized as agent',
          data: {},
        });
      }

      // Fetch transactions for players under this agent
      results = await db
        .select({
          playerId: users.id,
          playerName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
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
          commission: sql`SUM(
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
        .where(and(eq(agents.userId, userId), ...conditions))
        .groupBy(ledger.entry, users.id, users.firstName, users.lastName, ledger.result)
        .orderBy(sql`MAX(${ledger.date})`)
        .limit(recordsLimit)
        .offset(recordsOffset);

      totalRecordsQuery = await db
        .select({ count: sql`COUNT(DISTINCT ${ledger.entry})` })
        .from(ledger)
        .innerJoin(users, eq(ledger.userId, users.id))
        .innerJoin(players, eq(users.id, players.userId))
        .innerJoin(agents, eq(players.agentId, agents.id))
        .where(and(eq(agents.userId, userId), ...conditions));

    } else if (user.role === 'SUPERAGENT') {
      // Get super agent's ID and commission rates
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
          uniqueCode: 'CGP0083',
          message: 'Not authorized as super agent',
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
          credit: sql`SUM(${ledger.credit})`,
          debit: sql`SUM(${ledger.debit})`,
          commission: sql`SUM(
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
        .where(and(eq(superAgents.userId, userId), ...conditions))
        .groupBy(ledger.entry, users.id, users.firstName, users.lastName, ledger.result)
        .orderBy(sql`MAX(${ledger.date})`)
        .limit(recordsLimit)
        .offset(recordsOffset);

      totalRecordsQuery = await db
        .select({ count: sql`COUNT(DISTINCT ${ledger.entry})` })
        .from(ledger)
        .innerJoin(users, eq(ledger.userId, users.id))
        .innerJoin(agents, eq(users.id, agents.userId))
        .innerJoin(superAgents, eq(agents.superAgentId, superAgents.id))
        .where(and(eq(superAgents.userId, userId), ...conditions));
    } else {
      return res.status(403).json({
        uniqueCode: 'CGP0084',
        message: 'Unauthorized role',
        data: {},
      });
    }

    const totalRecords = parseInt(totalRecordsQuery[0]?.count) || 0;
    const nextOffset = recordsOffset + recordsLimit < totalRecords
      ? recordsOffset + recordsLimit
      : null;

    let response = {
      uniqueCode: 'CGP0085',
      message: 'Transactions fetched successfully',
      data: {
        results,
        pagination: {
          totalRecords,
          nextOffset,
        },
      },
    };

    logToFolderInfo('Transactions/controller', 'getAgentTransactions', response);
    return res.json(response);
  } catch (error) {
    let errorResponse = {
      uniqueCode: 'CGP0086',
      message: 'Internal Server Error',
      error: error.message,
    };

    logToFolderError('Transactions/controller', 'getAgentTransactions', errorResponse);
    return res.status(500).json(errorResponse);
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
        uniqueCode: 'CGP0087',
        message: 'User not found',
        data: {},
      });
    }

    let isAuthorized = false;
    if (user.role === 'AGENT') {
      // Verify agent owns this player
      const [player] = await db
        .select()
        .from(players)
        .innerJoin(agents, eq(players.agentId, agents.id))
        .where(and(eq(players.userId, targetId), eq(agents.userId, userId)));

      isAuthorized = !!player;
    } else if (user.role === 'SUPERAGENT') {
      // Verify super agent owns this agent
      const [agent] = await db
        .select()
        .from(agents)
        .innerJoin(superAgents, eq(agents.superAgentId, superAgents.id))
        .where(and(eq(agents.userId, targetId), eq(superAgents.userId, userId)));

      isAuthorized = !!agent;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        uniqueCode: 'CGP0088',
        message: 'Unauthorized: Target does not belong to this user',
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
      status: credit > 0 ? 'WIN' : 'LOSS',
      result: note,
    };

    // Insert transaction
    const result = await db.insert(ledger).values(newEntry);

    let response = {
      uniqueCode: 'CGP0089',
      success: true,
       message: 'Transaction entry created successfully',
      data: {
        results: [result],
        summary: {},
        pagination: {},
      },
    };

    logToFolderInfo('Transactions/controller', 'createTransactionEntry', response);
    return res.status(201).json(response);
  } catch (error) {
    let errorResponse = {
      uniqueCode: 'CGP0090',
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    };

    logToFolderError('Transactions/controller', 'createTransactionEntry', errorResponse);
    return res.status(500).json(errorResponse);
  }
};