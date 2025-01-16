import { GAME_STATES } from "../../services/shared/config/types.js";

// Function to start Andar Bahar
export async function startAndarBahar(gameInstance) {
  try {
    gameInstance.status = GAME_STATES.BETTING;
    gameInstance.startTime = Date.now();

    // Save game state
    await gameInstance.saveState();

    // Log specific game state for Andar Bahar
    gameInstance.logSpecificGameState();

    // Set the betting phase interval
    gameInstance.gameInterval = setTimeout(async () => {
      await gameInstance.startDealing();
    }, gameInstance.BETTING_PHASE_DURATION);
  } catch (error) {
    console.error(`Failed to start AndarBahar game: ${error}`);
  }
}

// Function to start Lucky 7B
export async function startLucky7B(gameInstance) {
  try {
    gameInstance.status = GAME_STATES.BETTING;
    gameInstance.startTime = Date.now();

    // Save game state
    await gameInstance.saveState();

    // Log game state for Lucky 7B
    gameInstance.logGameState("Game Started - Betting Phase");

    // Set the betting phase interval
    gameInstance.gameInterval = setTimeout(async () => {
      await gameInstance.startDealing();
    }, gameInstance.BETTING_PHASE_DURATION);
  } catch (error) {
    console.error(`Failed to start Lucky7B game: ${error}`);
  }
}