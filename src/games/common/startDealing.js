import { GAME_STATES } from "../../services/shared/config/types.js";
import redis from "../../config/redis.js";

// Andar Bahar: Function to start dealing cards
export async function startDealingAndarBahar(gameInstance) {
  gameInstance.status = GAME_STATES.DEALING;
  gameInstance.deck = await gameInstance.shuffleDeck(gameInstance.deck);
  gameInstance.jokerCard = gameInstance.deck.shift();
  await gameInstance.saveState();
  await gameInstance.dealCards();
}

// Lucky 7B: Function to start dealing cards
export async function startDealingLucky7B(gameInstance) {
  gameInstance.blindCard = gameInstance.deck.shift();
  gameInstance.status = GAME_STATES.DEALING;
  gameInstance.secondCard = await gameInstance.calculateResult(); // Sets the second card
  console.log("second set:", gameInstance.secondCard);
  await gameInstance.saveState();

  gameInstance.logGameState("Dealing Phase Started");

  setTimeout(async () => {
    await gameInstance.revealCards();
  }, gameInstance.CARD_DEAL_DURATION);
}
