import { logger } from "../../../logger/logger.js";
import GameFactory from "./factory.js";
import { loggerGameSendingState } from "./helper/loggerGameSendingState.js";
import gameManager from "./manager.js";
import { GAME_STATES, GAME_TYPES } from "./types.js";
import redis from "../../../config/redis.js";

/* SPAGHETTI CODE: */

const gameTypeToConstructorName = {
  [GAME_TYPES.ANDAR_BAHAR_TWO]: "AndarBaharTwoGame",
  [GAME_TYPES.LUCKY7B]: "Lucky7BGame",
  [GAME_TYPES.TEEN_PATTI]: "TeenPattiGame",
  [GAME_TYPES.DRAGON_TIGER]: "DragonTigerGame",
  [GAME_TYPES.ANDAR_BAHAR]: "AndarBaharGame",
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
          gameId: currentGame.gameId,
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

        loggerGameSendingState(gameState);
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
export function broadcastGameState() {
  const io = global.io?.of("/game");
  if (!io) {
    logger.error("Socket.IO instance not found");
    return;
  }

  if (this.gameType === GAME_TYPES.TEEN_PATTI && this.gameType === GAME_STATES.DEALING) {

    const w = this.winner;
    let w_x = null;

    const FinalA = [];
    const FinalB = [];

    let a_counter = 0;
    let b_counter = 0;

    for (let i = 0; i <= 6; i++) {
      setTimeout(() => {

        if (i % 2 === 0 && i !== 6) {
            FinalA.push(this.playerA[a_counter]);
            a_counter++;
        } else if (i % 2 !== 0 && i !== 6) {
            FinalB.push(this.playerB[b_counter]);
            b_counter++;
        } else {

        }

        if (i === 6) {
          w_x = w;
        }

        const gameState = {
          gameType: this.gameType,
          gameId: this.gameId,
          status: this.status,
          cards: {
            jokerCard: this.jokerCard || null,
            blindCard: this.blindCard || null,
            playerA: FinalA,
            playerB: FinalB,
            playerC: [],
          },
          winner: w_x,
          startTime: this.startTime,
        };

        console.log(gameState);
        // loggerGameSendingState(gameState);
        io.to(`game:${gameState.gameType}`).emit("gameStateUpdate", gameState);
      }, i * 1000); // Emit each card state with 1 second delay
    }
  } else {
    const gameState = {
      gameType: this.gameType,
      gameId: this.gameId,
      status: this.status,
      cards: {
        jokerCard: this.jokerCard || null,
        blindCard: this.blindCard || null,
        playerA: this.playerA || [],
        playerB: this.playerB || [],
        playerC: this.playerC || [],
      },
      winner: this.real_winner, // resolve this workaround later.
      startTime: this.startTime,
    };

    console.log(gameState);
    // loggerGameSendingState(gameState);
    io.to(`game:${gameState.gameType}`).emit("gameStateUpdate", gameState);
  }
}
