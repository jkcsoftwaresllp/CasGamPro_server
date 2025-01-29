import redis from "../../../config/redis.js";
import { logger } from "../../../logger/logger.js";
import { broadcastGameState } from "../config/handler.js";

export async function saveState(gameType) {
  try {
    await redis.hmset(`game:${this.gameId}`, {
      status: this.status,
      startTime: this.startTime,
      winner: this.winner || "",
      deck: JSON.stringify(this.deck),
    });
  } catch (error) {
    logger.error(`Failed to save game state for ${this.gameId}:`, error);
  }
}

export async function recoverState() {
  try {
    const state = await redis.hgetall(`game:${this.gameId}`);
    if (state && Object.keys(state).length) {
      this.status = state.status;
      this.startTime = state.startTime;
      this.winner = state.winner || null;
      this.deck = JSON.parse(state.deck);
    }
  } catch (error) {
    logger.error(`Failed to recover game state for ${this.gameId}:`, error);
  }
}

export async function clearState() {
  try {
    await redis.del(`game:${this.gameId}`);
  } catch (error) {
    logger.error(`Failed to clear game state for ${this.gameId}:`, error);
  }
}

export async function storeGameResult(gameData) {
  try {
    // Store in Redis
    await redis.lpush("game_history", JSON.stringify(gameData));
    await redis.ltrim("game_history", 0, 99); // Keep last 100 games

    // Broadcast to connected clients
    if (global.historyIO) {
      await broadcastGameResult(global.historyIO, gameData);
    }
  } catch (error) {
    logger.error(`Failed to store game result for ${gameData.gameId}:`, error);
  }
}
