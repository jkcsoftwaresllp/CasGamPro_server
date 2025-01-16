import { GAME_STATES, GAME_TYPES } from "../../services/shared/config/types.js";
import gameManager from "../../services/shared/config/manager.js";

// End game function for Andar Bahar
export async function endGameAndarBahar(gameInstance) {
  gameInstance.status = GAME_STATES.COMPLETED;
  await gameInstance.storeGameResult();
  gameInstance.logSpecificGameState();
}

// End game function for Lucky 7B
export async function endGameLucky7B(gameInstance) {
  gameInstance.status = GAME_STATES.COMPLETED;
  await gameInstance.saveState();
  await gameInstance.storeGameResult();
  gameInstance.logGameState("Game Completed");

  setTimeout(async () => {
    try {
      await gameInstance.clearState();
      const newGame = await gameManager.startNewGame(GAME_TYPES.LUCKY7B);
      gameManager.activeGames.delete(gameInstance.gameId);
      await newGame.start();
    } catch (error) {
      console.error("Failed to start new game:", error);
    }
  }, 5000);
}
