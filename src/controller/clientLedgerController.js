import { db } from '../config/db.js';
import { ledger, users } from '../database/schema.js';
import { eq, desc } from 'drizzle-orm';
import { logger } from '../logger/logger.js';
import { createResponse } from '../helper/responseHelper.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { formatDate } from '../utils/formatDate.js';

export const getClientLedger = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { limit = 30, offset = 0 } = req.query;
    const { limit: validLimit, offset: validOffset } = getPaginationParams(limit, offset);

    // Get detailed ledger entries
    const entries = await db
      .select({
        date: ledger.createdAt,
        entry: ledger.entry,
        transactionType: ledger.transactionType,
        amount: ledger.amount,
        debit: ledger.debit,
        credit: ledger.credit,
        balance: ledger.newBalance,
        status: ledger.status,
      })
      .from(ledger)
      .where(eq(ledger.userId, userId))
      .orderBy(desc(ledger.createdAt))
      .limit(validLimit)
      .offset(validOffset);

    // Format response
    const formattedEntries = entries.map((entry) => ({
      date: formatDate(entry.date),
      entry: entry.entry,
      type: entry.transactionType,
      debit: parseFloat(entry.debit) || 0,
      credit: parseFloat(entry.credit) || 0,
      balance: parseFloat(entry.balance),
      status: entry.status,
    }));

    return res.status(200).json(
      createResponse('success', 'CGP0020', 'Ledger entries fetched successfully', {
        results: formattedEntries,
      })
    );
  } catch (error) {
    logger.error('Error fetching ledger entries:', error);
    return res.status(500).json(
      createResponse('error', 'CGP0021', 'Internal server error')
    );
  }
};