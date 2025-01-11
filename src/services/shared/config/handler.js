import gameManager from './manager.js';
import { GAME_TYPES } from './types.js';


/* SPAGHETTI CODE: */

const gameTypeToConstructorName = {
  [GAME_TYPES.ANDAR_BAHAR]: 'AndarBaharGame',
  [GAME_TYPES.LUCKY7B]: 'Lucky7BGame',
  [GAME_TYPES.TEEN_PATTI]: 'TeenPattiGame',
};


export const gameHandler = (io) => {
  const gameIO = io.of('/game');

  gameIO.on('connection', (socket) => {
    // console.log('Client connected to game namespace');

    socket.on('joinGameType', (gameType) => {
      // console.log('Join request for game type:', gameType);

      // Validate game type
      if (!Object.values(GAME_TYPES).includes(gameType)) {
        console.log('Invalid game type:', gameType);
        socket.emit('error', 'Invalid game type');
        return;
      }

      socket.join(`game:${gameType}`);

      // Find current game of this type
      const constructorName = gameTypeToConstructorName[gameType];
      const currentGame = gameManager.getActiveGames()
        .find(game => game.constructor.name === constructorName);

      console.log('Current game found:', currentGame?.gameId);
      console.log('Active games:', gameManager.getActiveGames().map(g => ({
        id: g.gameId,
        type: g.constructor.name
      })));

      if (currentGame) {

        const gameState = {
          gameType,
          gameId: currentGame.gameId,
          status: currentGame.status,
          cards: {
            jokerCard: currentGame.jokerCard || null,
            blindCard: currentGame.blindCard || null,
            playerA: currentGame.collectCards("A") || [],
            playerB: currentGame.collectCards("B") || [],
            playerC: currentGame.collectCards("C") || [],
          },
          winner: currentGame.winner,
          startTime: currentGame.startTime,
        };
        // console.log('Emitting initial game state:', gameState);
        socket.emit('gameStateUpdate', gameState);
      } else {
        console.log('No active game found for type:', gameType);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected from game namespace');
    });
  });

  return gameIO;
};

// Broadcast game state update
export const broadcastGameState = (game) => {
  const io = global.io?.of('/game');
  if (!io) {
    console.error('Socket.IO instance not found');
    return;
  }

  const gameType = Object.entries(gameTypeToConstructorName)
    .find(([_, constructorName]) => constructorName === game.constructor.name)?.[0];

  // console.log('Broadcasting to game type:', gameType);

  const gameState = {
    gameType,
    gameId: game.gameId,
    status: game.status,
    jokerCard: game.jokerCard,
    andarCards: game.andarCards,
    baharCards: game.baharCards,
    winner: game.winner,
    startTime: game.startTime,
  };

  // console.log('Broadcasting state:', gameState);

  // Broadcast to game type room
  io.to(`game:${gameType}`).emit('gameStateUpdate', gameState);
  // console.log('Broadcast complete');
};
