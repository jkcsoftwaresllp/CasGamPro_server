import { db } from "../config/db.js";
import { logger } from "../logger/logger.js";
import { agents, superAgents, users } from "../database/schema.js"
import { eq, and, gte, lte } from "drizzle-orm";
import { filterUtils } from "../utils/filterUtils.js";
import { format } from "date-fns";

export const createInOutEntry = async (req, res) => {
  try {
    const {
      targetId, // ID of the agent/player being modified
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
      return res.status(400).json({
        uniqueCode: 'CGP0085',
        message: 'Target ID, date and description are required',
        data: {},
      });
    }

    // Fetch user role
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({
        uniqueCode: 'CGP0086',
        message: 'User not found',
        data: {},
      });
    }

    // Parse and validate date format
    let formattedDate;
    try {
      formattedDate = formatDate(date);
    } catch (error) {
      return res.status(400).json({
        uniqueCode: "CGP0087",
        message: "Invalid date format. Use DD-MM-YYYY",
        data: {},
      });
    }

    // Validate numeric fields
    const numericFields = { aya, gya, commPosative, commNegative, limit };
    for (const [field, value] of Object.entries(numericFields)) {
      if (value !== undefined && (isNaN(value) || value < 0)) {
        return res.status(400).json({
          uniqueCode: 'CGP0088',
          message: `Invalid ${field} value. Must be a non-negative number`,
          data: {},
        });
      }
    }

    let result;
    if (user.role === 'AGENT') {
      // Verify the player belongs to this agent
      const [player] = await db
        .select()
        .from(players)
        .innerJoin(agents, eq(players.agentId, agents.id))
        .where(and(eq(players.userId, targetId), eq(agents.userId, userId)));

      if (!player) {
        return res.status(403).json({
          uniqueCode: 'CGP0089',
          message: 'Player not found or unauthorized',
          data: {},
        });
      }

      // Update player record
      result = await db
        .update(players)
        .set({
          inoutDate: parsedDate,
          inoutDescription: description,
          aya: aya || 0,
          gya: gya || 0,
          commPositive: commPosative || 0,
          commNegative: commNegative || 0,
          limitValue: limit || 0,
        })
        .where(eq(players.userId, targetId));

    } else if (user.role === 'SUPERAGENT') {
      // Verify the agent belongs to this super agent
      const [agent] = await db
        .select()
        .from(agents)
        .innerJoin(superAgents, eq(agents.superAgentId, superAgents.id))
        .where(and(eq(agents.userId, targetId), eq(superAgents.userId, userId)));

      if (!agent) {
        return res.status(403).json({
          uniqueCode: 'CGP0090',
          message: 'Agent not found or unauthorized',
          data: {},
        });
      }

      // Update agent record
      result = await db
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
        .where(eq(agents.userId, targetId));
    } else {
      return res.status(403).json({
        uniqueCode: 'CGP0091',
        message: 'Unauthorized role',
        data: {},
      });
    }

    if (!result) {
      return res.status(404).json({
        uniqueCode: 'CGP0092',
        message: 'Failed to update record',
        data: {},
      });
    }

    return res.status(200).json({
      uniqueCode: 'CGP0093',
      message: 'In-Out entry updated successfully',
      data: {
        date: format(parsedDate, 'dd-MM-yyyy'),
        description,
        aya: aya || 0,
        gya: gya || 0,
        commPositive: commPosative || 0,
        commNegative: commNegative || 0,
        limit: limit || 0,
      },
    });
  } catch (error) {
    logger.error('Error updating in-out entry:', error);
    return res.status(500).json({
      uniqueCode: 'CGP0094',
      message: 'Internal server error',
      data: {},
    });
  }
};

export const inOutReport = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { startDate, endDate } = req.query;
    
    // Get filter conditions
    const conditions = filterUtils({ userId, startDate, endDate });

    // Fetch user role
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({
        uniqueCode: 'CGP0095',
        message: 'User not found',
        data: {},
      });
    }

    let results = [];
    if (user.role === 'AGENT') {
      // Fetch data for players under the agent
      results = await db
        .select({
          date: players.inoutDate,
          description: players.inoutDescription,
          aya: players.aya,
          gya: players.gya,
          commPositive: players.commPositive,
          commNegative: players.commNegative,
          limit: players.limitValue,
          name: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        })
        .from(players)
        .innerJoin(users, eq(players.userId, users.id))
        .innerJoin(agents, eq(players.agentId, agents.id))
        .where(and(eq(agents.userId, userId), ...conditions))
        .orderBy(players.inoutDate);
    } else if (user.role === 'SUPERAGENT') {
      // Fetch data for agents under the super agent
      results = await db
        .select({
          date: agents.inoutDate,
          description: agents.inoutDescription,
          aya: agents.aya,
          gya: agents.gya,
          commPositive: agents.commPositive,
          commNegative: agents.commNegative,
          limit: agents.limitValue,
          name: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        })
        .from(agents)
        .innerJoin(users, eq(agents.userId, users.id))
        .innerJoin(superAgents, eq(agents.superAgentId, superAgents.id))
        .where(and(eq(superAgents.userId, userId), ...conditions))
        .orderBy(agents.inoutDate);
    } else {
      return res.status(403).json({
        uniqueCode: 'CGP0096',
        message: 'Unauthorized role',
        data: {},
      });
    }

    // Format response
    const formattedResults = results.map((entry) => ({
      date: format(entry.date, 'dd-MM-yyyy'),
      description: entry.description,
      name: entry.name,
      aya: entry.aya,
      gya: entry.gya,
      commPosative: entry.commPositive,
      commNegative: entry.commNegative,
      limit: entry.limit,
    }));

    return res.status(200).json({
      uniqueCode: 'CGP0097',
      message: 'In-Out entries fetched successfully',
      data: { results: formattedResults },
    });
  } catch (error) {
    logger.error('Error fetching In-Out entries:', error);
    return res.status(500).json({
      uniqueCode: 'CGP0098',
      message: 'Internal server error',
      data: {},
    });
  }
};