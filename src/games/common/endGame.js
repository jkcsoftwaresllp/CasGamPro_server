import { GAME_STATES, GAME_TYPES } from "../../services/shared/config/types.js";
import gameManager from "../../services/shared/config/manager.js";
import { logger } from "../../logger/logger.js";

export async function endGame() {
  this.status = GAME_STATES.COMPLETED;

  // Common operations for games
  await this.storeGameResult();

  switch (this.gameType) {
    case GAME_TYPES.ANDAR_BAHAR:

      this.status = GAME_STATES.COMPLETED;
      await this.saveState();
      await this.storeGameResult();

      this.logGameState("Game Completed");

      setTimeout(async () => {
        try {
          await this.clearState();
          const newGame = await gameManager.startNewGame(
            GAME_TYPES.ANDAR_BAHAR,
          );
          gameManager.activeGames.delete(this.gameId);

          newGame.resetGame();
          await newGame.start();
        } catch (error) {
          console.error("Failed to start new game:", error);
        }
      }, 5000);
      break;

    case GAME_TYPES.LUCKY7B:
      await this.saveState();
      this.logGameState("Game Completed");
      setTimeout(async () => {
        try {
          await this.clearState();
          const newGame = await gameManager.startNewGame(GAME_TYPES.LUCKY7B);
          gameManager.activeGames.delete(this.gameId);
          await newGame.start();
        } catch (error) {
          logger.error("Failed to start new game:", error);
        }
      }, 5000);
      break;

    case GAME_TYPES.TEEN_PATTI:
      setTimeout(async () => {
        try {
          await this.clearState();
          const newGame = await gameManager.startNewGame(GAME_TYPES.TEEN_PATTI);
          gameManager.activeGames.delete(this.gameId);
          await newGame.start();
        } catch (error) {
          logger.error("Failed to start new game:", error);
        }
      }, 5000);
      break;

    case GAME_TYPES.DRAGON_TIGER:
      setTimeout(async () => {
        try {
          await this.clearState();
          const newGame = await gameManager.startNewGame(GAME_TYPES.DRAGON_TIGER);
          gameManager.activeGames.delete(this.gameId);
          await newGame.start();
        } catch (error) {
          logger.error("Failed to start new game:", error);
        }
      }, 5000);
      break;

      case GAME_TYPES.ANDAR_BAHAR_TWO:
       setTimeout(async () => {
        try {
          await this.clearState();
          const newGame = await gameManager.startNewGame(GAME_TYPES.ANDAR_BAHAR_TWO);
          gameManager.activeGames.delete(this.gameId);

          newGame.resetGame();
          await newGame.start();
        } catch (error) {
          logger.error("Failed to start new Andar Bahar Two game:", error);
        }
      }, 5000);
      break;

    default:
      logger.warn(`Unknown game type: ${this.gameType}`);
      break;
  }
}