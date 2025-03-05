import { db } from '../../config/db.js';
import { logger } from '../../logger/logger.js';
import { agents, superAgents, users } from '../../database/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { filterUtils } from '../../utils/filterUtils.js';
import { format } from 'date-fns';

export const createAgentInOutEntry = async (req, res) => {
  try {
    const {
      agentId,
      date,
      description,
      aya,
      gya,
      commPosative,
      commNegative,
      limit,
    } = req.body;

    const superAgentId = req.session.userId;

    // Validate required fields
    if (!agentId || !date || !description) {
      return res.status(400).json({
        uniqueCode: 'CGP0185',
        message: 'Agent ID, date and description are required',
        data: {},
      });
    }

    // Verify agent belongs to this super agent
    const agent = await db
      .select()
      .from(agents)
      .innerJoin(superAgents, eq(agents.superAgentId, superAgents.id))
      .where(and(eq(agents.userId, agentId), eq(superAgents.userId, superAgentId)));

    if (!agent.length) {
      return res.status(403).json({
        uniqueCode: 'CGP0186',
        message: 'Agent not found or unauthorized',
        data: {},
      });
    }

    // Parse and validate date format
    let parsedDate;
    try {
      parsedDate = parse(date, 'dd-MM-yyyy', new Date());
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      return res.status(400).json({
        uniqueCode: 'CGP0187',
        message: 'Invalid date format. Use DD-MM-YYYY',
        data: {},
      });
    }

    // Validate numeric fields
    const numericFields = { aya, gya, commPosative, commNegative, limit };
    for (const [field, value] of Object.entries(numericFields)) {
      if (value !== undefined && (isNaN(value) || value < 0)) {
        return res.status(400).json({
          uniqueCode: 'CGP0188',
          message: `Invalid ${field} value. Must be a non-negative number`,
          data: {},
        });
      }
    }

    // Update agent record
    const result = await db
      .update(agents)
      .set({
        inoutDate: parsedDate,
        inoutDescription: description,
        aya: aya || 0,
        gya: gya || 0,
        commPositive: commPosative || 0,
        commNegative: commNegative || 0,
        limitValue: limit || 0,
      })
      .where(eq(agents.userId, agentId));

    if (!result) {
      return res.status(404).json({
        uniqueCode: 'CGP0189',
        message: 'Failed to update agent record',
        data: {},
      });
    }

    const updatedAgent = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, agentId))
      .limit(1);

    return res.status(200).json({
      uniqueCode: 'CGP0190',
      message: 'In-Out entry updated successfully',
      data: {
        date: format(updatedAgent[0].inoutDate, 'dd-MM-yyyy'),
        description: updatedAgent[0].inoutDescription,
        aya: updatedAgent[0].aya,
        gya: updatedAgent[0].gya,
        commPositive: updatedAgent[0].commPositive,
        commNegative: updatedAgent[0].commNegative,
        limit: updatedAgent[0].limitValue,
      },
    });
  } catch (error) {
    logger.error('Error updating in-out entry:', error);
    return res.status(500).json({
      uniqueCode: 'CGP0191',
      message: 'Internal server error',
      data: {},
    });
  }
};

export const getAgentInOutReport = async (req, res) => {
  try {
    const superAgentId = req.session.userId;
    const { startDate, endDate } = req.query;
    
    // Get filter conditions
    const conditions = filterUtils({ superAgentId, startDate, endDate });

    // Fetch data from database
    const results = await db
      .select({
        date: agents.inoutDate,
        description: agents.inoutDescription,
        aya: agents.aya,
        gya: agents.gya,
        commPositive: agents.commPositive,
        commNegative: agents.commNegative,
        limit: agents.limitValue,
        agentName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(agents)
      .innerJoin(users, eq(users.id, agents.userId))
      .innerJoin(superAgents, eq(agents.superAgentId, superAgents.id))
      .where(and(...conditions))
      .orderBy(agents.inoutDate);

    // Format response
    const formattedResults = results.map((entry) => ({
      date: format(entry.date, 'dd-MM-yyyy'),
      description: entry.description,
      agentName: entry.agentName,
      aya: entry.aya,
      gya: entry.gya,
      commPosative: entry.commPositive,
      commNegative: entry.commNegative,
      limit: entry.limit,
    }));

    return res.status(200).json({
      uniqueCode: 'CGP0192',
      message: 'In-Out entries fetched successfully',
      data: { results: formattedResults },
    });
  } catch (error) {
    logger.error('Error fetching In-Out entries:', error);
    return res.status(500).json({
      uniqueCode: 'CGP0193',
      message: 'Internal server error',
      data: {},
    });
  }
};