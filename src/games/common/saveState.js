import redis from "../../config/redis.js";
import { logger } from "../../logger/logger.js";

export async function saveState(gameType, gameInstance, superSaveState) {
  return ;
  try {
    // generic game state
    // await superSaveState();

    console.log("this stupid function is triggering");

    const redisKey = `game:${gameInstance.gameId}:${gameType.toLowerCase()}`;

    const state = {};
    if (gameType === "AndarBahar") {
      state.jokerCard = gameInstance.jokerCard || "";
      state.andarCards = JSON.stringify(gameInstance.andarCards || []);
      state.baharCards = JSON.stringify(gameInstance.baharCards || []);
    } else if (gameType === "Lucky7B") {
      state.blindCard = gameInstance.blindCard ? JSON.stringify(gameInstance.blindCard) : "";
      state.secondCard = gameInstance.secondCard ? JSON.stringify(gameInstance.secondCard) : "";
      state.bettingResults = JSON.stringify(gameInstance.bettingResults || {});
      state.winner = gameInstance.winner || "";
    }else if (gameType === "TeenPatti") {
      state.player1Cards = JSON.stringify(gameInstance.player1Cards || []);
      state.player2Cards = JSON.stringify(gameInstance.player2Cards || []);
      state.bettingResults = JSON.stringify(gameInstance.bettingResults || {});
      state.pot = gameInstance.pot || 0;
      state.winner = gameInstance.winner || "";
    }else if (gameType === "DragonTiger") {
      state.dragonCard = gameInstance.dragonCard ? JSON.stringify(gameInstance.dragonCard) : "";
      state.tigerCard = gameInstance.tigerCard ? JSON.stringify(gameInstance.tigerCard) : "";
      state.bettingResults = JSON.stringify(gameInstance.bettingResults || {});
      state.winner = gameInstance.winner || "";
    }

    await redis.hmset(redisKey, state);
  } catch (error) {
    logger.error(`New save function failed: ${gameType} ${gameInstance.gameId}`, error);
  }
}
