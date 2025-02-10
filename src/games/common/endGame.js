import { GAME_STATES, GAME_TYPES } from "../../services/shared/config/types.js";
import gameManager from "../../services/shared/config/manager.js";
import { logger } from "../../logger/logger.js";

export async function endGame() {
  this.status = GAME_STATES.COMPLETED;

  switch (this.gameType) {
    case GAME_TYPES.ANDAR_BAHAR_TWO:

      this.status = GAME_STATES.COMPLETED;
      this.real_winner = this.winner;
      await this.broadcastGameState();

      this.logGameState("Game Completed");

      setTimeout(async () => {
        try {
          const newGame = await gameManager.startNewGame(GAME_TYPES.ANDAR_BAHAR_TWO,);
          gameManager.activeGames.delete(this.gameId);
          await newGame.start();
        } catch (error) {
          console.error("Failed to start new game:", error);
        }
      }, 5000);
      break;

    case GAME_TYPES.LUCKY7B:
      this.status = GAME_STATES.COMPLETED;
      this.real_winner = this.winner;
      await this.broadcastGameState();
      this.logGameState("Game Completed");
      setTimeout(async () => {
        try {
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
          const newGame = await gameManager.startNewGame(GAME_TYPES.TEEN_PATTI);
          gameManager.activeGames.delete(this.gameId);
          await newGame.start();
        } catch (error) {
          logger.error("Failed to start new game:", error);
        }
      }, 5000);
      break;

    case GAME_TYPES.DRAGON_TIGER:
      this.status = GAME_STATES.COMPLETED;
      this.real_winner = this.winner;
      await this.broadcastGameState();
      setTimeout(async () => {
        try {
          const newGame = await gameManager.startNewGame(GAME_TYPES.DRAGON_TIGER);
          gameManager.activeGames.delete(this.gameId);
          await newGame.start();
        } catch (error) {
          logger.error("Failed to start new game:", error);
        }
      }, 5000);
      break;

    case GAME_TYPES.ANDAR_BAHAR:
      this.status = GAME_STATES.COMPLETED;
      this.real_winner = this.winner;
      await this.broadcastGameState();
      setTimeout(async () => {
        try {
          const newGame = await gameManager.startNewGame(GAME_TYPES.ANDAR_BAHAR);
          gameManager.activeGames.delete(this.gameId);

          newGame.resetGame();
          await newGame.start();
        } catch (error) {
          logger.error("Failed to start new Andar Bahar Two game:", error);
        }
      }, 5000);
      break;

    case GAME_TYPES.DRAGON_TIGER_LION:
      this.status = GAME_STATES.COMPLETED;
      this.real_winner = this.winner;
      await this.broadcastGameState();
      this.logGameState("Game Completed");

      setTimeout(async () => {
        try {
          const newGame = await gameManager.startNewGame(GAME_TYPES.DRAGON_TIGER_LION);
          gameManager.activeGames.delete(this.gameId);
          await newGame.start();
        } catch (error) {
          logger.error("Failed to start new Dragon Tiger Lion game:", error);
        }
      }, 5000);
      break;

    default:
      logger.warn(`Unknown game type: ${this.gameType}`);
      break;
  }
}
