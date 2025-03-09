import { db } from '../../config/db.js';
import { rounds, games, bets, players, agents, users, superAgents, categories } from '../../database/schema.js';
import { sql, eq, and, desc } from 'drizzle-orm';
import { format } from 'date-fns';
import { logger } from '../../logger/logger.js';

// Get main casino summary
export const getLiveCasinoReports = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Fetch user role
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({
        uniqueCode: 'CGP0281',
        message: 'User not found',
        data: {},
      });
    }

    console.log('User:', user);

    let results = [];

    if (user.role === 'AGENT') {
      // Get agent's ID and commission rate
      const [agent] = await db
        .select({
          id: agents.id,
          maxShare: agents.maxShare,
        })
        .from(agents)
        .where(eq(agents.userId, userId));

      if (!agent) {
        return res.status(403).json({
          uniqueCode: 'CGP0282',
          message: 'Not authorized as agent',
          data: {},
        });
      }

      console.log('Agent:', agent);

      // Get all categories with their total profit/loss (without date filter)
      const query = db
        .select({
          title: categories.name,
          date: sql`DATE(${rounds.createdAt})`,
          profitLoss: sql`
            SUM(
              CASE 
                WHEN ${bets.win} = 1 THEN -${bets.betAmount} 
                ELSE ${bets.betAmount}
              END
            ) * ${agent.maxShare} / 100
          `,
        })
        .from(categories)
        .innerJoin(games, eq(games.categoryId, categories.id))
        .innerJoin(rounds, eq(rounds.gameId, games.gameType))
        .innerJoin(bets, eq(bets.roundId, rounds.roundId))
        .innerJoin(players, eq(bets.playerId, players.id))
        .where(eq(players.agentId, agent.id))
        .groupBy(categories.name, sql`DATE(${rounds.createdAt})`)
        .orderBy(desc(sql`DATE(${rounds.createdAt})`));

      console.log('Agent SQL Query:', query.toSQL());

      results = await query;

    } else if (user.role === 'SUPERAGENT') {
      // Get super agent's ID and commission rate
      const [superAgent] = await db
        .select({
          id: superAgents.id,
          maxShare: superAgents.maxCasinoCommission,
        })
        .from(superAgents)
        .where(eq(superAgents.userId, userId));

      if (!superAgent) {
        return res.status(403).json({
          uniqueCode: 'CGP0283',
          message: 'Not authorized as super agent',
          data: {},
        });
      }

      console.log('SuperAgent:', superAgent);

      const query = db
        .select({
          title: categories.name,
          date: sql`DATE(${rounds.createdAt})`,
          profitLoss: sql`
            SUM(
              CASE 
                WHEN ${bets.win} = 1 THEN -${bets.betAmount}
                ELSE ${bets.betAmount}
              END
            ) * ${superAgent.maxShare} / 100
          `,
        })
        .from(categories)
        .innerJoin(games, eq(games.categoryId, categories.id))
        .innerJoin(rounds, eq(rounds.gameId, games.gameType))
        .innerJoin(bets, eq(bets.roundId, rounds.roundId))
        .innerJoin(players, eq(bets.playerId, players.id))
        .innerJoin(agents, eq(players.agentId, agents.id))
        .where(eq(agents.superAgentId, superAgent.id))
        .groupBy(categories.name, sql`DATE(${rounds.createdAt})`)
        .orderBy(desc(sql`DATE(${rounds.createdAt})`));

      console.log('SuperAgent SQL Query:', query.toSQL());

      results = await query;
    }

    console.log('SQL Query Results:', results);

    // Format dates and numbers
    const formattedResults = results.map(result => ({
      ...result,
      date: format(new Date(result.date), 'dd-MM-yyyy'),
      profitLoss: Number(result.profitLoss || 0).toFixed(2)
    }));

    return res.status(200).json({
      uniqueCode: 'CGP0284',
      message: 'Live casino reports fetched successfully',
      data: { results: formattedResults }
    });

  } catch (error) {
    logger.error('Error fetching live casino reports:', error);
    return res.status(500).json({
      uniqueCode: 'CGP0285',
      message: 'Error fetching live casino reports',
      data: { error: error.message },
    });
  }
};


// Get detailed game reports for a specific casino category
export const getLiveCasinoGameReports = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { categoryName, date } = req.params;

    // Fetch user role
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({
        uniqueCode: 'CGP0286',
        message: 'User not found',
        data: {},
      });
    }

    let results = [];

    if (user.role === 'AGENT') {
      // Get agent's ID and commission rate
      const [agent] = await db
        .select({
          id: agents.id,
          maxShare: agents.maxShare,
        })
        .from(agents)
        .where(eq(agents.userId, userId));

      if (!agent) {
        return res.status(403).json({
          uniqueCode: 'CGP0287',
          message: 'Not authorized as agent',
          data: {},
        });
      }

      results = await db
        .select({
          date: sql`DATE(${rounds.createdAt})`,
          description: games.name,
          betAmount: sql`SUM(${bets.betAmount})`,
          agentPL: sql`
            SUM(
              CASE 
                WHEN ${bets.win} = 1 THEN -${bets.betAmount}
                ELSE ${bets.betAmount}
              END
            ) * ${agent.maxShare} / 100
          `,
          companyPL: sql`
            SUM(
              CASE 
                WHEN ${bets.win} = 1 THEN -${bets.betAmount}
                ELSE ${bets.betAmount}
              END
            ) * (100 - ${agent.maxShare}) / 100
          `,
        })
        .from(categories)
        .innerJoin(games, eq(games.categoryId, categories.id))
        .innerJoin(rounds, eq(rounds.gameId, games.gameType))
        .innerJoin(bets, eq(bets.roundId, rounds.roundId))
        .innerJoin(players, eq(bets.playerId, players.id))
        .where(
          and(
            eq(players.agentId, agent.id),
            eq(categories.name, categoryName),
            eq(sql`DATE(${rounds.createdAt})`, date)
          )
        )
        .groupBy(games.name, sql`DATE(${rounds.createdAt})`)
        .orderBy(desc(sql`DATE(${rounds.createdAt})`));

    } else if (user.role === 'SUPERAGENT') {
      // Get super agent's ID and commission rate
      const [superAgent] = await db
        .select({
          id: superAgents.id,
          maxShare: superAgents.maxCasinoCommission,
        })
        .from(superAgents)
        .where(eq(superAgents.userId, userId));

      if (!superAgent) {
        return res.status(403).json({
          uniqueCode: 'CGP0288',
          message: 'Not authorized as super agent',
          data: {},
        });
      }

      results = await db
        .select({
          date: sql`DATE(${rounds.createdAt})`,
          description: games.name,
          betAmount: sql`SUM(${bets.betAmount})`,
          agentPL: sql`
            SUM(
              CASE 
                WHEN ${bets.win} = 1 THEN -${bets.betAmount}
                ELSE ${bets.betAmount}
              END
            ) * ${superAgent.maxShare} / 100
          `,
          companyPL: sql`
            SUM(
              CASE 
                WHEN ${bets.win} = 1 THEN -${bets.betAmount}
                ELSE ${bets.betAmount}
              END
            ) * (100 - ${superAgent.maxShare}) / 100
          `,
        })
        .from(categories)
        .innerJoin(games, eq(games.categoryId, categories.id))
        .innerJoin(rounds, eq(rounds.gameId, games.gameType))
        .innerJoin(bets, eq(bets.roundId, rounds.roundId))
        .innerJoin(players, eq(bets.playerId, players.id))
        .innerJoin(agents, eq(players.agentId, agents.id))
        .where(
          and(
            eq(agents.superAgentId, superAgent.id),
            eq(categories.name, categoryName),
            eq(sql`DATE(${rounds.createdAt})`, date)
          )
        )
        .groupBy(games.name, sql`DATE(${rounds.createdAt})`)
        .orderBy(desc(sql`DATE(${rounds.createdAt})`));
    }

    // Format dates and numbers
    const formattedResults = results.map(result => ({
      ...result,
      date: format(new Date(result.date), 'dd-MM-yyyy'),
      betAmount: Number(result.betAmount || 0).toFixed(2),
      agentPL: Number(result.agentPL || 0).toFixed(2),
      companyPL: Number(result.companyPL || 0).toFixed(2)
    }));

    return res.status(200).json({
      uniqueCode: 'CGP0289',
      message: 'Game reports fetched successfully',
      data: { results: formattedResults }
    });

  } catch (error) {
    logger.error('Error fetching game reports:', error);
    return res.status(500).json({
      uniqueCode: 'CGP0290',
      message: 'Error fetching game reports',
      data: { error: error.message },
    });
  }
};