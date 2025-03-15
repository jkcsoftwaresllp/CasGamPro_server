import { db } from '../../../../config/db.js';
import { game_rounds, game_bets, users, games } from '../../../../database/schema.js';
import { eq, and, sql, desc } from 'drizzle-orm';
import { logger } from '../../../../logger/logger.js';

// Function to fetch live games data for an agent
export const fetchLiveGamesData = async (agentId) => {
  try {
    // Validate agent (assuming agents table has a userId field to identify agent)
    const [agent] = await db
      .select()
      .from(users)
      .where(eq(users.id, agentId)); // Assuming 'users' is the table containing agents

    if (!agent) {
      logger.error(`Invalid agent ID: ${agentId}`);
      return { error: 'Agent not found', data: [] };
    }

    // Get all players under this agent (Assuming 'players' table refers to 'users')
    const agentPlayers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.agentId, agent.id)); // Assuming there's an 'agentId' field in users to identify player-agent relation

    if (!agentPlayers.length) {
      return { data: [] };
    }

    const playerIds = agentPlayers.map(p => p.id);

    // Get live games data
    const liveGamesData = await db
      .select({
        title: sql`CONCAT(${games.name}, ' Round ', ${game_rounds.id})`,
        date: sql`DATE_FORMAT(${game_rounds.createdAt}, '%d-%m-%Y')`,
        declare: sql`CASE WHEN ${game_rounds.winner} IS NOT NULL THEN true ELSE false END`,
        profitLoss: sql`COALESCE(
          SUM(${game_bets.betAmount}) - 
          SUM(CASE WHEN ${game_bets.winAmount} IS NOT NULL THEN ${game_bets.betAmount} ELSE 0 END),
          0
        )`,
        roundId: game_rounds.id,
        gameId: games.id
      })
      .from(game_rounds)
      .innerJoin(games, eq(games.id, game_rounds.gameId))
      .leftJoin(game_bets, eq(game_bets.roundId, game_rounds.id))
      .where(sql`${game_bets.user_id} IN (${playerIds.join(',')})`)
      .groupBy(game_rounds.id, games.name)
      .orderBy(desc(game_rounds.createdAt))
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
