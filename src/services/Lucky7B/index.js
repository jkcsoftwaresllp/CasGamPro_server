import BaseGame from "../shared/config/base_game.js";
import { GAME_TYPES, initializeGameProperties } from "../shared/config/types.js";
import {
  findLeastBetCategory,
  determineWinningCategory,
  narrowDownCards,
  selectRandomCard,
} from "./helper.js";

export default class Lucky7BGame extends BaseGame {
  constructor(roundId) {
		super(roundId);
		const props = initializeGameProperties(GAME_TYPES.LUCKY7B);
	  Object.assign(this, props);
	}

  async firstServe() {
    this.blindCard = this.deck.shift();
  }

  async determineOutcome(bets) {
    return new Promise((resolve) => {
      const categories = {
        lowMidHigh: ["low", "mid", "high"],
        evenOdd: ["even", "odd"],
        blackRed: ["black", "red"],
      };

      const leastBets = {
        lowMidHigh: findLeastBetCategory(categories.lowMidHigh, bets),
        evenOdd: findLeastBetCategory(categories.evenOdd, bets),
        blackRed: findLeastBetCategory(categories.blackRed, bets),
      };

      const narrowedCards = narrowDownCards(leastBets);
      const selectedCard = selectRandomCard(narrowedCards);

      const dealingInterval = setInterval(() => {
        const rank = selectedCard.slice(1);
        const numRank = isNaN(parseInt(rank))
          ? rank === "A"
            ? 1
            : rank === "J"
              ? 11
              : rank === "Q"
                ? 12
                : rank === "K"
                  ? 13
                  : 7
          : parseInt(rank);

        if (numRank < 7) {
          this.players.A.push(selectedCard); // PlayerA is low
        } else if (numRank > 7) {
          this.players.B.push(selectedCard); // PlayerB is high
        }
        clearInterval(dealingInterval);
        this.winner = [...determineWinningCategory(selectedCard)];
        resolve();
      }, this.CARD_DEAL_INTERVAL);
    });
  }
}
