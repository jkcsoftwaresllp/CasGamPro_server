import { GAME_STATES, GAME_TYPES } from "../../services/shared/config/types.js";
import gameManager from "../../services/shared/config/manager.js";
import { logger } from "../../logger/logger.js";

export async function endGame(gameType, gameInstance) {
  gameInstance.status = GAME_STATES.COMPLETED;

  // Common operations for games
  await gameInstance.storeGameResult();

  switch (gameType) {
    case "AndarBahar":
      gameInstance.logSpecificGameState();
      await gameInstance.saveState();
      await gameInstance.storeGameResult();

      setTimeout(async () => {
        try {
          await gameInstance.clearState();
          const newGame = await gameManager.startNewGame(
              GAME_TYPES.ANDAR_BAHAR,
          );
          gameManager.activeGames.delete(gameInstance.gameId);

          newGame.resetGame();
          await newGame.start();
        } catch (error) {
          console.error("Failed to start new game:", error);
        }
      }, 5000);
      break;

    case "Lucky7B":
      await gameInstance.saveState();
      gameInstance.logGameState("Game Completed");
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
      break;

    case "TeenPatti":
      setTimeout(async () => {
        try {
          await gameInstance.clearState();
          const newGame = await gameManager.startNewGame(GAME_TYPES.TEEN_PATTI);
          gameManager.activeGames.delete(gameInstance.gameId);
          await newGame.start();
        } catch (error) {
          logger.error("Failed to start new game:", error);
        }
      }, 5000);
      break;

    case "DragonTiger":
      setTimeout(async () => {
        try {
          await gameInstance.clearState();
          const newGame = await gameManager.startNewGame(GAME_TYPES.DRAGON_TIGER);
          gameManager.activeGames.delete(gameInstance.gameId);
          await newGame.start();
        } catch (error) {
          logger.error("Failed to start new game:", error);
        }
      }, 5000);
      break;

    default:
      logger.warn(`Unknown game type: ${gameType}`);
      break;
  }
}