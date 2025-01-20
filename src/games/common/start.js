import { logger } from "../../logger/logger.js";
import { GAME_STATES } from "../../services/shared/config/types.js";

export async function startGame(gameType, gameInstance) {
  try {
    gameInstance.status = GAME_STATES.BETTING;
    gameInstance.startTime = Date.now();

    await gameInstance.saveState();

    if (gameType === "AndarBahar") {
      gameInstance.logSpecificGameState();
    } else if (gameType === "Lucky7B") {
      gameInstance.logGameState("Game Started - Betting Phase");
    }

    gameInstance.gameInterval = setTimeout(async () => {
      await gameInstance.startDealing();
    }, gameInstance.BETTING_PHASE_DURATION);
  } catch (error) {
    logger.error(`Failed to start ${gameType} game: ${error}`);
  }
}
