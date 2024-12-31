import GameFactory from "./factory.js";
import {GAME_CONFIGS} from "./types.js";

class GameManager {
  constructor() {
    this.activeGames = new Map();
    this.gameTypes = GAME_CONFIGS;
  }

  startNewGame(gameType) {
    const gameId = `${gameType}_${Date.now()}`;
    const game = GameFactory.createGame(gameType, gameId);
    this.activeGames.set(gameId, game);
    return game;
  }

  getActiveGames() {
    return Array.from(this.activeGames.values());
  }

}

export default new GameManager();
