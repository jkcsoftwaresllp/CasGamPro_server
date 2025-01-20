import { logger } from "../logger/logger.js";
import gameManager from "./shared/config/manager.js";

export async function initializeGameServices() {
  try {
    // Checking if there is any existing game state in Redis
    await gameManager.syncWithRedis();

    // Otherwise...
    for (const gameConfig of gameManager.gameTypes) {
      const existingGame = Array.from(gameManager.activeGames.values()).find(
        (game) => game.constructor.name === gameConfig.type
      );

      if (!existingGame) {
        const game = await gameManager.startNewGame(gameConfig.type);
        await game.start();
      }
    }

    logger.info(
      `Game Manager initilised and total runing games on server : ${gameManager.activeGames.size}`
    );
  } catch (error) {
    logger.error("Failed to initialize game services:", error);
  }
}
