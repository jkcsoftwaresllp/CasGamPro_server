import { db } from '../config/db.js';
import { logger } from '../logger/logger.js';
import { users, user_limits_commissions, ledger } from '../database/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { format } from 'date-fns';
import { filterDateUtils } from '../utils/filterUtils.js';
import { createResponse } from '../helper/responseHelper.js';

export const inOutReport = async (req, res) => {
  try {
    const agentUserId = req.session.userId;
    if (!agentUserId) {
      return res.status(400).json(
        createResponse('error', 'CGP0033', 'Agent User ID is required')
      );
    }

    // Get all transactions for users under this agent
    const transactions = await db
      .select({
        date: sql`DATE(${ledger.createdAt})`.as('date'),
        userId: ledger.userId,
        username: users.username,
        totalDeposit: sql`SUM(CASE WHEN ${ledger.transactionType} = 'DEPOSIT' THEN ${ledger.amount} ELSE 0 END)`.as('totalDeposit'),
        totalWithdrawal: sql`SUM(CASE WHEN ${ledger.transactionType} = 'WITHDRAWAL' THEN ${ledger.amount} ELSE 0 END)`.as('totalWithdrawal'),
        latestBalance: sql`MAX(${ledger.newBalance})`.as('latestBalance'),
      })
      .from(ledger)
      .leftJoin(users, eq(ledger.userId, users.id))
      .where(eq(users.parent_id, agentUserId))
      .groupBy(sql`DATE(${ledger.createdAt}), ${ledger.userId}, ${users.username}`);

    // Apply filters
    const { startDate, endDate } = req.query;
    const filteredTransactions = filterDateUtils({
      data: transactions,
      startDate,
      endDate,
    });

    const formattedResults = filteredTransactions.map((entry) => ({
      date: format(entry.date, 'dd-MM-yyyy'),
      username: entry.username || 'Unknown User',
      description: `Total transactions for ${entry.username}`,
      debit: entry.totalDeposit || 0,
      credit: entry.totalWithdrawal || 0,
      balance: entry.latestBalance || 0,
    }));

    return res.status(200).json(
      createResponse('success', 'CGP0034', 'Agent transactions fetched successfully', {
        results: formattedResults,
      })
    );
  } catch (error) {
    logger.error('Error fetching agent transactions:', error);
    return res.status(500).json(
      createResponse('error', 'CGP0035', 'Internal server error')
    );
  }
};