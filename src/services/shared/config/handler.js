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

        console.log(`sending state for ${gameType}: ${gameState}`)

        socket.emit("gameStateUpdate", gameState);
      } else {
        logger.info("No active game found for type:", gameType);
      }
    });

    socket.on("disconnect", () => {
      logger.info("Client disconnected from game namespace");
    });

    // ----------- //

    socket.on("joinVideoStream", (gameId) => {
      socket.join(`video:${gameId}`);
    });

    socket.on("leaveVideoStream", (gameId) => {
      socket.leave(`video:${gameId}`);
    });
  });

  return gameIO;
};

export const broadcastVideoFrame = (gameId, frameData) => {
  const io = global.io?.of("/game");
  if (!io) {
    logger.error("Socket.IO instance not found");
    return;
  }

  // io.to(`video:${gameId}`).emit("videoFrame", {
  //   gameId,
  //   ...frameData
  // });
  //
  io.emit("videoFrame", frameData);
};

export const broadcastVideoStatus = (_, status) => {
  const io = global.io?.of("/game");
  if (!io) {
    logger.error("Socket.IO instance not found");
    return;
  }

  // Broadcast to all connected clients
  io.emit("videoStatus", { status });
};

// Broadcast game state update
export const broadcastGameState = (game) => {
  const io = global.io?.of("/game");
  if (!io) {
    logger.error("Socket.IO instance not found");
    return;
  }

  const gameType = Object.entries(gameTypeToConstructorName).find(
    ([_, constructorName]) => constructorName === game.constructor.name,
  )?.[0];

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

  io.to(`game:${gameType}`).emit("gameStateUpdate", gameState);
};
