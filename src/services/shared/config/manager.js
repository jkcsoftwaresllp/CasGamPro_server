import GameFactory from "./factory.js";
import { GAME_CONFIGS } from "./types.js";
import redis from "../../../config/redis.js";
import { logger } from "../../../logger/logger.js";

class GameManager {
  constructor() {
    this.activeGames = new Map();
  }

  async startNewGame(gameType) {
    try {
      const gameId = `${gameType}_${Date.now()}`;
      const game = GameFactory.createGame(gameType, gameId);
      this.activeGames.set(gameId, game);
      return game; // Return the game instance
    } catch (error) {
      logger.error("Failed to create new game:", error);
      throw error;
    }
  }

  endGame(gameId) { //TODO: change this to "end"
    // get gameInstance from the pool

    // get gameType from the instance
    
    // delete instance only if there are 0 clients.
    
    // reset the game states and give new round Id.  
   
    return ;
  }

  getActiveGames() {
    return Array.from(this.activeGames.values());
  }

  getGameById(gameId) {
    return this.activeGames.get(gameId);
  }
}

export default new GameManager();
