import { logger } from "../../../logger/logger.js";
import gameManager from "./manager.js";
import { GAME_TYPES } from "./types.js";

/* SPAGHETTI CODE: */

const gameTypeToConstructorName = {
  [GAME_TYPES.ANDAR_BAHAR]: "AndarBaharGame",
  [GAME_TYPES.LUCKY7B]: "Lucky7BGame",
  [GAME_TYPES.TEEN_PATTI]: "TeenPattiGame",
  [GAME_TYPES.DRAGON_TIGER]: "DragonTigerGame",
};

export const gameHandler = (io) => {
  const gameIO = io.of("/game");

  gameIO.on("connection", (socket) => {
    socket.on("joinGameType", (gameType) => {
      // Validate game type
      if (!Object.values(GAME_TYPES).includes(gameType)) {
        logger.info("Invalid game type:", gameType);
        socket.emit("error", "Invalid game type");
        return;
      }

      socket.join(`game:${gameType}`);

      // Find current game of this type
      const constructorName = gameTypeToConstructorName[gameType];
      const currentGame = gameManager
        .getActiveGames()
        .find((game) => game.constructor.name === constructorName);

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
        socket.emit("gameStateUpdate", gameState);
      } else {
        logger.info("No active game found for type:", gameType);
      }
    });

    socket.on("disconnect", () => {
      logger.info("Client disconnected from game namespace");
    });
  });

  return gameIO;
};

// Broadcast game state update
export const broadcastGameState = (game) => {
  const io = global.io?.of("/game");
  if (!io) {
    logger.error("Socket.IO instance not found");
    return;
  }

  const gameType = Object.entries(gameTypeToConstructorName).find(
    ([_, constructorName]) => constructorName === game.constructor.name
  )?.[0];

  // Find current game of this type
  // const constructorName = gameTypeToConstructorName[gameType];
  // const currentGame = gameManager.getActiveGames()
  //   .find(game => game.constructor.name === constructorName);

  // const gameState = {
  //   gameType,
  //   gameId: game.gameId,
  //   status: game.status,
  //   jokerCard: game.jokerCard,
  //   andarCards: game.andarCards,
  //   baharCards: game.baharCards,
  //   winner: game.winner,
  //   startTime: game.startTime,
  // };

  const gameState = {
    gameType,
    gameId: game.gameId,
    status: game.status,
    cards: {
      jokerCard: game.jokerCard || null,
      blindCard: game.blindCard || null,
      playerA: game.collectCards("A") || [],
      playerB: game.collectCards("B") || [],
      playerC: game.collectCards("C") || [],
    },
    winner: game.winner,
    startTime: game.startTime,
  };

  // Broadcast to game type room
  io.to(`game:${gameType}`).emit("gameStateUpdate", gameState);
};
