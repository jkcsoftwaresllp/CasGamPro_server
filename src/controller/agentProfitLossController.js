import { db } from '../config/db.js';
import { users } from '../database/schema.js';
import { eq, and, sql, desc } from 'drizzle-orm';
import { filterUtils } from '../utils/filterUtils.js';
import { logger } from '../logger/logger.js';
import { getGameName } from '../utils/getGameName.js';
import { 
  rounds, 
  bets, 
  players, 
  agents, 
  superAgents 
} from '../database/schema.js';

export const getProfitLoss = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.session.userId;

    // Fetch user role
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({
        uniqueCode: 'CGP0093',
        message: 'User not found',
        data: {},
      });
    }

    let profitLossData = [];
    const conditions = filterUtils({ startDate, endDate });

    if (user.role === 'AGENT') {
      // Get all players under this agent
      const [agent] = await db
        .select({ id: agents.id })
        .from(agents)
        .where(eq(agents.userId, userId));

      if (!agent) {
        return res.status(403).json({
          uniqueCode: 'CGP0094',
          message: 'Not authorized as agent',
          data: {},
        });
      }

      const playersList = await db
        .select({ id: players.id })
        .from(players)
        .where(eq(players.agentId, agent.id));

      if (playersList.length === 0) {
        return res.status(200).json({
          uniqueCode: 'CGP0095',
          message: 'No players found for this agent',
          data: [],
        });
      }

      const playerIds = playersList.map(p => p.id);

      // Fetch profit/loss data for all players
      profitLossData = await db
        .select({
          date: sql`DATE_FORMAT(${rounds.createdAt}, '%d-%m-%Y')`,
          roundId: rounds.roundId,
          gameId: rounds.gameId,
          roundEarning: sql`
            COALESCE(
              SUM(${bets.betAmount}) - SUM(CASE WHEN ${bets.win} = true THEN ${bets.betAmount} ELSE 0 END), 
              0
            )
          `,
          commissionEarning: sql`
            COALESCE(SUM(${bets.betAmount} * ${agents.maxCasinoCommission} / 100), 0)
          `,
          totalEarning: sql`
            COALESCE(
              SUM(${bets.betAmount}) - SUM(CASE WHEN ${bets.win} = true THEN ${bets.betAmount} ELSE 0 END) + 
              SUM(${bets.betAmount} * ${agents.maxCasinoCommission} / 100),
              0
            )
          `,
        })
        .from(rounds)
        .leftJoin(bets, eq(bets.roundId, rounds.roundId))
        .leftJoin(players, eq(players.id, bets.playerId))
        .where(and(sql`${bets.playerId} IN (${playerIds.join(',')})`, ...conditions))
        .groupBy(rounds.roundId)
        .orderBy(desc(rounds.createdAt));

    } else if (user.role === 'SUPERAGENT') {
      // Get all agents under this super agent
      const [superAgent] = await db
        .select({ id: superAgents.id })
        .from(superAgents)
        .where(eq(superAgents.userId, userId));

      if (!superAgent) {
        return res.status(403).json({
          uniqueCode: 'CGP0096',
          message: 'Not authorized as super agent',
          data: {},
        });
      }

      const agentsList = await db
        .select({
          id: agents.id,
          name: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        })
        .from(agents)
        .innerJoin(users, eq(agents.userId, users.id))
        .where(eq(agents.superAgentId, superAgent.id));

      if (agentsList.length === 0) {
        return res.status(200).json({
          uniqueCode: 'CGP0097',
          message: 'No agents found for this super agent',
          data: [],
        });
      }

      // Fetch profit/loss data for each agent
      for (const agent of agentsList) {
        const agentData = await db
          .select({
            date: sql`DATE_FORMAT(${rounds.createdAt}, '%d-%m-%Y')`,
            roundId: rounds.roundId,
            gameId: rounds.gameId,
            roundEarning: sql`
              COALESCE(
                SUM(${bets.betAmount}) - SUM(CASE WHEN ${bets.win} = true THEN ${bets.betAmount} ELSE 0 END), 
                0
              )
            `,
            commissionEarning: sql`
              COALESCE(SUM(${bets.betAmount} * ${agents.maxCasinoCommission} / 100), 0)
            `,
            totalEarning: sql`
              COALESCE(
                SUM(${bets.betAmount}) - SUM(CASE WHEN ${bets.win} = true THEN ${bets.betAmount} ELSE 0 END) + 
                SUM(${bets.betAmount} * ${agents.maxCasinoCommission} / 100),
                0
              )
            `,
          })
          .from(rounds)
          .leftJoin(bets, eq(bets.roundId, rounds.roundId))
          .leftJoin(players, eq(players.id, bets.playerId))
          .where(and(eq(players.agentId, agent.id), ...conditions))
          .groupBy(rounds.roundId)
          .orderBy(desc(rounds.createdAt));

        if (agentData.length > 0) {
          profitLossData.push({
            agentId: agent.id,
            agentName: agent.name,
            data: agentData.map(row => ({
              date: row.date,
              roundId: row.roundId.toString(),
              roundTitle: getGameName(row.gameId),
              roundEarning: parseFloat(row.roundEarning),
              commissionEarning: parseFloat(row.commissionEarning),
              totalEarning: parseFloat(row.totalEarning),
            }))
          });
        }
      }
    } else {
      return res.status(403).json({
        uniqueCode: 'CGP0098',
        message: 'Unauthorized role',
        data: {},
      });
    }

    return res.status(200).json({
      uniqueCode: 'CGP0099',
      message: 'Profit/loss data fetched successfully',
      data: { results: profitLossData },
    });
  } catch (error) {
    logger.error('Error fetching profit/loss data:', error);
    return res.status(500).json({
      uniqueCode: 'CGP0100',
      message: 'Internal server error',
      data: {},
    });
  }
};