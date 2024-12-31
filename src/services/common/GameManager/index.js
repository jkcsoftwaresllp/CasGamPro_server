import AndarBaharGame from "../../AndarBahar/index.js";

class GameManager {
  constructor() {
    this.activeGames = new Map();
    this.gameTypes = ["ANDAR_BAHAR"];
  }

  initializeAllGames() {
    this.gameTypes.forEach((gameType) => {
      const game = this.createNewGame(gameType);
      game.start();
    });

    console.log("\n=== Game Manager Initialized ===");
    console.log(`Total Games Running: ${this.activeGames.size}\n`);
  }

  createNewGame(gameType) {
    const gameId = `${gameType}_${Date.now()}`;
    const game = new AndarBaharGame(gameId);
    this.activeGames.set(gameId, game);
    return game;
  }

  getActiveGames() {
    return Array.from(this.activeGames.values());
  }
}

export const gameManager = new GameManager();
