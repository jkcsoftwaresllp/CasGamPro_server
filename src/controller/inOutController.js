import { db } from '../config/db.js';
import { logger } from '../logger/logger.js';
import { users, user_limits_commissions } from '../database/schema.js';
import { eq, and } from 'drizzle-orm';
import { createResponse } from '../helper/responseHelper.js';
import { filterDateUtils } from '../utils/filterUtils.js';
import { format } from 'date-fns';

export const createInOutEntry = async (req, res) => {
  try {
    const {
      targetId,
      date,
      description,
      aya,
      gya,
      commPosative,
      commNegative,
      limit,
    } = req.body;

    const userId = req.session.userId;

    // Validate required fields
    if (!targetId || !date || !description) {
      return res.status(400).json(
        createResponse('error', 'CGP0026', 'Target ID, date and description are required')
      );
    }

    // Fetch user role
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json(
        createResponse('error', 'CGP0027', 'User not found')
      );
    }

    // Parse and validate date format
    let parsedDate;
    try {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      return res.status(400).json(
        createResponse('error', 'CGP0028', 'Invalid date format. Use YYYY-MM-DD')
      );
    }

    // Validate numeric fields
    const numericFields = { aya, gya, commPosative, commNegative, limit };
    for (const [field, value] of Object.entries(numericFields)) {
      if (value !== undefined && (isNaN(value) || value < 0)) {
        return res.status(400).json(
          createResponse('error', 'CGP0029', `Invalid ${field} value. Must be a non-negative number`)
        );
      }
    }

    // Update user limits and commissions
    const result = await db
      .update(user_limits_commissions)
      .set({
        min_bet: limit || 0,
        max_casino_commission: commPosative || 0,
        max_lottery_commission: commNegative || 0,
      })
      .where(eq(user_limits_commissions.user_id, targetId));

    if (!result) {
      return res.status(404).json(
        createResponse('error', 'CGP0030', 'Failed to update record')
      );
    }

    return res.status(200).json(
      createResponse('success', 'CGP0031', 'In-Out entry updated successfully', {
        date: format(parsedDate, 'yyyy-MM-dd'),
        description,
        aya: aya || 0,
        gya: gya || 0,
        commPosative: commPosative || 0,
        commNegative: commNegative || 0,
        limit: limit || 0,
      })
    );
  } catch (error) {
    logger.error('Error updating in-out entry:', error);
    return res.status(500).json(
      createResponse('error', 'CGP0032', 'Internal server error')
    );
  }
};