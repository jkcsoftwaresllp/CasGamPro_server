import { GAME_STATES } from "../shared/config/types.js";

export async function determineWinner(gameInstance) {
  try {
    gameInstance.status = GAME_STATES.COMPLETED;
    gameInstance.winner = await gameInstance.calculateResult();
    await gameInstance.saveState();
    
    gameInstance.logGameState("Winner Determined");
    
    await gameInstance.distributeWinnings();
    await gameInstance.endGame();
  } catch (error) {
    console.error("Error in determineWinner:", error);
    throw error;
  }
}