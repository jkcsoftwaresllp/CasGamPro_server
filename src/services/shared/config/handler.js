import { logGameStateUpdate } from "../helper/logGameStateUpdate.js";
import GameFactory from "./factory.js";
import gameManager from "./manager.js";
import { GAME_STATES, GAME_TYPES } from "./types.js";

/* SPAGHETTI CODE: */

const gameTypeToConstructorName = {
  [GAME_TYPES.ANDAR_BAHAR_TWO]: "AndarBaharTwoGame",
  [GAME_TYPES.LUCKY7B]: "Lucky7BGame",
  [GAME_TYPES.LUCKY7A]: "Lucky7AGame",
  [GAME_TYPES.TEEN_PATTI]: "TeenPattiGame",
  [GAME_TYPES.DRAGON_TIGER]: "DragonTigerGame",
  [GAME_TYPES.DRAGON_TIGER_TWO]: "DragonTigerTwoGame",
  [GAME_TYPES.ANDAR_BAHAR]: "AndarBaharGame",
  [GAME_TYPES.DRAGON_TIGER_LION]: "DTLGame",
};

export const gameHandler = (io) => {
  const gameIO = io.of("/game");

  gameIO.on("connection", (socket) => {
    socket.on("joinGameType", (gameType) => {
      // Validate game type
      if (!GameFactory.gameTypes.has(gameType)) {
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
          roundId: currentGame.roundId,
          status: currentGame.status,
          cards: {
            jokerCard: currentGame.jokerCard || null,
            blindCard: currentGame.blindCard || null,
            playerA: currentGame.playerA || [],
            playerB: currentGame.playerB || [],
            playerC: currentGame.playerC || [],
          },
          winner: currentGame.winner,
          startTime: currentGame.startTime,
        };

        // consoleGameSendingState(gameState);
        logGameStateUpdate(gameState);
        socket.emit("gameStateUpdate", gameState);
      } else {
        console.error("No active game found for type:", gameType);
      }
    });

    socket.on("disconnect", () => {
      console.error("Client disconnected from game namespace");
    });

    // ----------- //

    socket.on("joinVideoStream", (roundId) => {
      socket.join(`video:${roundId}`);
    });

    socket.on("leaveVideoStream", (roundId) => {
      socket.leave(`video:${roundId}`);
    });
  });

  return gameIO;
};

export const broadcastVideoFrame = (roundId, frameData) => {
  const io = global.io?.of("/game");
  if (!io) {
    console.error("Socket.IO instance not found");
    return;
  }

  // io.to(`video:${roundId}`).emit("videoFrame", {
  //   roundId,
  //   ...frameData
  // });
  //
  io.emit("videoFrame", frameData);
};

export const broadcastVideoStatus = (_, status) => {
  const io = global.io?.of("/game");
  if (!io) {
    console.error("Socket.IO instance not found");
    return;
  }

  // Broadcast to all connected clients
  io.emit("videoStatus", { status });
};
