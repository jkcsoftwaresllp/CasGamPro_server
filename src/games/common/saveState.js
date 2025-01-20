import redis from "../../config/redis.js";
import { logger } from "../../logger/logger.js";

export async function saveState(gameType, gameInstance, superSaveState) {
  try {
    // generic game state
    await superSaveState();

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
    }

    await redis.hmset(redisKey, state);
  } catch (error) {
    logger.error(`Failed to save state for ${gameType} game ${gameInstance.gameId}:`, error);
  }
}
