import { GAME_STATES, GAME_TYPES } from "../../services/shared/config/types.js";
import gameManager from "../../services/shared/config/manager.js";
import { logger } from "../../logger/logger.js";

export async function endGame(gameType, gameInstance) {
  gameInstance.status = GAME_STATES.COMPLETED;

  // Common operations for games
  await gameInstance.storeGameResult();

  // Andar Bahar
  if (gameType === "AndarBahar") {
    gameInstance.logSpecificGameState();
  } else if (gameType === "Lucky7B") {
    await gameInstance.saveState();
    gameInstance.logGameState("Game Completed");

    // Lucky 7B
    setTimeout(async () => {
      try {
        await gameInstance.clearState();
        const newGame = await gameManager.startNewGame(GAME_TYPES.LUCKY7B);
        gameManager.activeGames.delete(gameInstance.gameId);
        await newGame.start();
      } catch (error) {
        logger.error("Failed to start new game:", error);
      }
    }, 5000);
  }
}
