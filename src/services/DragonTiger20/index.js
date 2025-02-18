import BaseGame from "../shared/config/base_game.js";
import {
  GAME_TYPES,
  initializeGameProperties,
} from "../shared/config/types.js";
import { findLeastBetCategory, handleDragonTigerCategory } from "./helper.js";

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
      const leastBetCategory = findLeastBetCategory(bets);
      let winnerList;

      let cards = null;
      if (leastBetCategory === "pair" || leastBetCategory === "tie") {
        cards = handlePairTieCategory(leastBetCategory);
        winnerList = [leastBetCategory];
      } else {
        cards = handleDragonTigerCategory(leastBetCategory, bets);

        const prefix = leastBetCategory.slice(0, 1).toUpperCase();
        const { player, evenOdd, redBlack, card } = cards.winner;

        winnerList = [
          player,
          `${prefix}${evenOdd}`,
          `${prefix}${redBlack}`,
          card,
        ];
      }

      let cardsDealt = 0;
      const dealingInterval = setInterval(() => {
        if (cardsDealt === 0) this.blindCard = cards.blindCard;
        else if (cardsDealt === 1) this.players.A.push(cards.dragonCard);
        else if (cardsDealt === 2) this.blindCard = cards.blindCard;
        else if (cardsDealt === 3) this.players.B.push(cards.tigerCard);
        else {
          this.winner = winnerList;
          clearInterval(dealingInterval);
          resolve();
        }
        cardsDealt++;
      }, this.CARD_DEAL_INTERVAL);
    });
  }
}
