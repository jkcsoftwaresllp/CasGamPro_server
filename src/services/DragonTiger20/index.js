import BaseGame from "../shared/config/base_game.js";
import {
  GAME_CONFIGS,
  GAME_TYPES,
  initializeGameProperties,
} from "../shared/config/types.js";
import {
  initializeBetTotals,
  findLeastBetCategory,
  handleDragonTigerCategory,
} from "./helper.js";

export default class DragonTigerGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    const props = initializeGameProperties(GAME_TYPES.DRAGON_TIGER);
    Object.assign(this, props);
  }

  async firstServe() {
    return;
  }

  async determineOutcome(bets) {
    return new Promise((resolve) => {
      const betTotals = initializeBetTotals(bets);
      const leastBetCategory = findLeastBetCategory(betTotals);

      let cards = null;
      if (leastBetCategory === "pair" || leastBetCategory === "tie") {
        cards = handlePairTieCategory(leastBetCategory);
      } else {
        cards = handleDragonTigerCategory(leastBetCategory, betTotals);
      }

      this.blindCard = cards.blindCard;

      let cardsDealt = 0;
      const dealingInterval = setInterval(() => {
        if (cardsDealt === 0) {
          this.players.A.push(cards.dragonCard);
          cardsDealt++;
        } else if (cardsDealt === 1) {
          this.players.B.push(cards.tigerCard);
          cardsDealt++;
          this.winner = leastBetCategory;
          clearInterval(dealingInterval);
          resolve();
        }
      }, this.CARD_DEAL_INTERVAL);
    });
  }
}
