import { db } from '../../../../config/db.js';
import { rounds, bets, players, agents, games } from '../../../../database/schema.js';
import { eq, and, sql, desc } from 'drizzle-orm';
import { logger } from '../../../../logger/logger.js';

// Function to fetch live games data for an agent
export const fetchLiveGamesData = async (agentId) => {
  try {
    // Validate agent
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, agentId));

    if (!agent) {
      logger.error(`Invalid agent ID: ${agentId}`);
      return { error: 'Agent not found', data: [] };
    }

    // Get all players under this agent
    const agentPlayers = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.agentId, agent.id));

    if (!agentPlayers.length) {
      return { data: [] };
    }

    const playerIds = agentPlayers.map(p => p.id);

    // Get live games data
    const liveGamesData = await db
      .select({
        title: sql`CONCAT(${games.name}, ' Round ', ${rounds.id})`,
        date: sql`DATE_FORMAT(${rounds.createdAt}, '%d-%m-%Y')`,
        declare: sql`CASE WHEN ${rounds.winner} IS NOT NULL THEN true ELSE false END`,
        profitLoss: sql`COALESCE(
          SUM(${bets.betAmount}) - 
          SUM(CASE WHEN ${bets.win} = true THEN ${bets.betAmount} ELSE 0 END),
          0
        )`,
        roundId: rounds.id,
        gameId: games.id
      })
      .from(rounds)
      .innerJoin(games, eq(games.id, rounds.gameId))
      .leftJoin(bets, eq(bets.roundId, rounds.roundId))
      .where(sql`${bets.playerId} IN (${playerIds.join(',')})`)
      .groupBy(rounds.id, games.name)
      .orderBy(desc(rounds.createdAt))
      .limit(50);

    return { data: liveGamesData };
  } catch (error) {
    logger.error('Error fetching live games data:', error);
    return { error: 'Internal server error', data: [] };
  }
};

// Function to handle live games socket connection
export const handleLiveGamesSocket = (socket, io) => {
  // Handle agent joining live games room
  socket.on('joinLiveGames', async (agentId) => {
    try {
      if (!agentId) {
        socket.emit('liveGamesError', { message: 'Agent ID is required' });
        return;
      }

      // Join room for this agent
      socket.join(`liveGames:${agentId}`);
      
      // Fetch initial data
      const { data, error } = await fetchLiveGamesData(agentId);
      
      if (error) {
        socket.emit('liveGamesError', { message: error });
        return;
      }
      
      // Send initial data
      socket.emit('liveGamesUpdate', { data });
      
      logger.info(`Agent ${agentId} joined live games room`);
    } catch (error) {
      logger.error(`Error in joinLiveGames: ${error.message}`);
      socket.emit('liveGamesError', { message: 'Failed to join live games' });
    }
  });

  // Handle agent leaving live games room
  socket.on('leaveLiveGames', (agentId) => {
    if (agentId) {
      socket.leave(`liveGames:${agentId}`);
      logger.info(`Agent ${agentId} left live games room`);
    }
  });
};

// Function to broadcast live games updates to agents
export const broadcastLiveGamesUpdate = async (io, agentId) => {
  try {
    const { data, error } = await fetchLiveGamesData(agentId);
    
    if (error) {
      logger.error(`Error fetching data for broadcast: ${error}`);
      return;
    }
    
    io.to(`liveGames:${agentId}`).emit('liveGamesUpdate', { data });
  } catch (error) {
    logger.error(`Error broadcasting live games update: ${error.message}`);
  }
};