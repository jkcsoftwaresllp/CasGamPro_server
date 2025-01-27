import GameFactory from "./factory.js";
import { GAME_CONFIGS } from "./types.js";
import redis from "../../../config/redis.js";
import { logger } from "../../../logger/logger.js";

class GameManager {
  constructor() {
    this.activeGames = new Map();
    this.gameTypes = GAME_CONFIGS;
  }

  async startNewGame(gameType) {
    try {
      const gameId = `${gameType}_${Date.now()}`;
      const game = GameFactory.createGame(gameType, gameId);
      this.activeGames.set(gameId, game);
      await game.saveState();
      return game; // Return the game instance
    } catch (error) {
      logger.error("Failed to create new game:", error);
      throw error;
    }
  }

  getActiveGames() {
    return Array.from(this.activeGames.values());
  }

  getGameById(gameId) {
    return this.activeGames.get(gameId);
  }

  async syncWithRedis() {
    try {
      const gameKeys = await redis.keys("game:*");
      for (const key of gameKeys) {
        const gameId = key.split(":")[1];
        const gameType = await redis.hget(key, "type");
        console.info(`Syncing ${gameType} with redis`);
        if (gameType && !this.activeGames.has(gameId)) {
          const game = this.startNewGame(gameType);
          await game.recoverState();
        }
      }
    } catch (error) {
      logger.error("Failed to sync with Redis:", error);
    }
  }
}

export default new GameManager();
