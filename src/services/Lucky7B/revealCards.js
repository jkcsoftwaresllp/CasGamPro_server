import { GAME_STATES, GAME_TYPES } from "../shared/config/types.js";

// Function to reveal the cards and complete the game
export async function revealCards(gameInstance) {
    gameInstance.status = GAME_STATES.COMPLETED;
    gameInstance.winner = gameInstance.secondCard;
    await gameInstance.saveState();
  
    gameInstance.logGameState("Cards Revealed");
  
    // await gameInstance.distributeWinnings(result); // Uncomment this if needed
    await gameInstance.endGame();
  }
  