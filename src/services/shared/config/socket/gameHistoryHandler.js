/*import { logger } from "../../../../logger/logger.js";
import redis from "../../../../config/redis.js";
import { folderLogger } from "../../../../logger/folderLogger.js";

export const gameHistoryHandler = (io) => {
  return null;
};

async function getGameHistory(gameType, limit = 15) {
  try {
    const history = await redis.lrange("game_history", 0, 14); //last 15 games
    return history
      .map((game) => {
        try {
          const gameData = JSON.parse(game);
          if (!gameType || gameData.gameType === gameType) {
            return formatGameHistory(gameData);
          }
          return null;
        } catch (error) {
          logger.error("Error parsing game history:", error);
          return null;
        }
      })
      .filter(Boolean);
  } catch (error) {
    logger.error("Error fetching game history:", error);
    throw error;
  }
}

function formatGameHistory(gameData) {
  const baseInfo = {
    gameId: gameData.gameId,
    roundId: gameData.roundId,
    gameType: gameData.gameType,
    timestamp: gameData.timestamp,
    winner: gameData.winner,
  };

  switch (gameData.gameType) {
    case "DragonTiger":
      return {
        ...baseInfo,
        cards: {
          dragon: gameData.dragonCard,
          tiger: gameData.tigerCard,
        },
        result: {
          winner: gameData.winner,
          tie: gameData.winner === "tie",
          pair: gameData.pair || false,
        },
      };

    case "TeenPatti":
      return {
        ...baseInfo,
        cards: {
          player1: gameData.player1Cards,
          player2: gameData.player2Cards,
        },
      };

    case "Lucky7B":
      return {
        ...baseInfo,
        cards: {
          second: gameData.secondCard,
        },
        result: gameData.bettingResults,
      };

    case "AndarBahar":
      return {
        ...baseInfo,
        cards: {
          joker: gameData.jokerCard,
          andar: gameData.andarCards,
          bahar: gameData.baharCards,
        },
      };

    default:
      return baseInfo;
  }
}

export const broadcastGameResult = async (gameIO, gameData) => {
  try {
    const formattedHistory = formatGameHistory(gameData);
    gameIO
      .to(`history:${gameData.gameType}`)
      .emit("newGameResult", formattedHistory);
  } catch (error) {
    logger.error("Error broadcasting game result:", error);
  }
}; */

import { logger } from "../../../../logger/logger.js";
import redis from "../../../../config/redis.js";
import { folderLogger } from "../../../../logger/folderLogger.js";

export const gameHistoryHandler = (io) => {
  return null;
};

async function getGameHistory(gameType, limit = 15) {
  try {
    const history = await redis.lrange("game_history", 0, limit - 1); 
    return history
      .map((game) => {
        try {
          const gameData = JSON.parse(game);
          if (!gameType || gameData.gameType === gameType) {
            return formatGameHistory(gameData);  
          }
          return null;
        } catch (error) {
          logger.error("Error parsing game history:", error);
          return null;
        }
      })
      .filter(Boolean);  
  } catch (error) {
    logger.error("Error fetching game history:", error);
    throw error;
  }
}

function formatGameHistory(gameData) {
  const baseInfo = {
    gameId: gameData.gameId,
    roundId: gameData.roundId,
    winner: getWinner(gameData), 
  };

  return baseInfo;  
}

function getWinner(gameData) {
  switch (gameData.gameType) {
    case "DragonTiger":
      return gameData.winner === "dragon" ? "D" : "T";  

    case "AndarBahar":
      return gameData.winner === "andar" ? "A" : "B";  

    case "Lucky7B":
      if (gameData.winner === "low") return "L";  
      if (gameData.winner === "high") return "H";  
      if (gameData.winner === "mid") return "M";   
      return null;  

    default:
      return gameData.winner;  
  }
}

export const broadcastGameResult = async (gameIO, gameData) => {
  try {
    const formattedHistory = formatGameHistory(gameData);  
    gameIO
      .to(`history:${gameData.gameType}`)
      .emit("newGameResult", formattedHistory);  
  } catch (error) {
    logger.error("Error broadcasting game result:", error);
  }
}


