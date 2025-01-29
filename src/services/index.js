import { logger } from "../logger/logger.js";
import GameFactory from "./shared/config/factory.js";
import gameManager from "./shared/config/manager.js";

export async function initializeGameServices() {
  try {
    // Checking if there is any existing game state in Redis
    // await gameManager.syncWithRedis();

    // Otherwise...
    for (const gameType of GameFactory.gameTypes.keys()) {
      const game = await gameManager.startNewGame(gameType);
      await game.start();
    }

    logger.info(
      `Game Manager initilised and total runing games on server : ${gameManager.activeGames.size}`,
    );
  } catch (error) {
    logger.error("Failed to initialize game services:", error);
  }
}
