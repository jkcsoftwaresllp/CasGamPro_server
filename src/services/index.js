import GameFactory from "./shared/configs/factory.js";
import gameManager from "./shared/configs/manager.js";

export async function initializeGameServices() {
  try {
    // Checking if there is any existing game state in Redis
    await gameManager.syncWithRedis();

    // Otherwise...
    for (const gameConfig of gameManager.gameTypes) {
      const existingGame = Array.from(gameManager.activeGames.values()).find(
        (game) => game.constructor.name === gameConfig.type,
      );

      if (!existingGame) {
        const game = await gameManager.startNewGame(gameConfig.type);
        await game.start();
      }
    }

    console.log("\n=== Game Manager Initialized ===");
    console.log(`Total Games Running: ${gameManager.activeGames.size}`);
  } catch (error) {
    console.error("Failed to initialize game services:", error);
  }
}
