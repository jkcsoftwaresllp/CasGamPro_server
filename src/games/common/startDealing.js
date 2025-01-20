import { logger } from "../../logger/logger.js";
import { GAME_STATES } from "../../services/shared/config/types.js";

export async function startDealing(gameType, gameInstance) {
  try {
    gameInstance.status = GAME_STATES.DEALING;

    if (gameType === "AndarBahar") {
      gameInstance.deck = await gameInstance.shuffleDeck(gameInstance.deck);
      gameInstance.jokerCard = gameInstance.deck.shift();
      await gameInstance.saveState();
      await gameInstance.dealCards();
    } else if (gameType === "Lucky7B") {
      gameInstance.blindCard = gameInstance.deck.shift();
      gameInstance.secondCard = await gameInstance.calculateResult(); // Sets the second card
      await gameInstance.saveState();

      gameInstance.logGameState("Dealing Phase Started");

      setTimeout(async () => {
        await gameInstance.revealCards();
      }, gameInstance.CARD_DEAL_DURATION);
    }
  } catch (error) {
    logger.error(`Failed to start dealing for ${gameType}:`, error);
  }
}
