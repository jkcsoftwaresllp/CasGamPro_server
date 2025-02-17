import BaseGame from "../shared/config/base_game.js";
import {
  GAME_CONFIGS,
  GAME_STATES,
  GAME_TYPES,
	initializeGameProperties,
} from "../shared/config/types.js";

export default class AndarBaharTwoGame extends BaseGame {
  constructor(roundId) {
		super(roundId);
		const props = initializeGameProperties(GAME_TYPES.ANDAR_BAHAR_TWO);
	  Object.assign(this, props);
	}

  async preBetServe() {
    this.jokerCard = this.deck.shift();
  }

  async firstServe() {
    this.blindCard = this.deck.shift();
  }

  async determineOutcome() {
    return new Promise((resolve) => {
      let currentPosition = "A";

      const compareCards = (card) => {
        const cardRank = card.slice(1);
        const jokerRank = this.jokerCard.slice(1);
        return cardRank === jokerRank;
      };

      const dealingInterval = setInterval(() => {
        if (this.winner || this.deck.length === 0) {
          clearInterval(dealingInterval);
          resolve();
          return;
        }

        const nextCard = this.deck.shift();

        // Push directly to array - proxy will catch the change
        this.players[currentPosition].push(nextCard);

        if (compareCards(nextCard)) {
          this.winner = currentPosition === "A" ? "Andar" : "Bahar";
          clearInterval(dealingInterval);
          resolve();
          return;
        }

        currentPosition = currentPosition === "A" ? "B" : "A";
      }, this.CARD_DEAL_INTERVAL);
    });
  }
}
