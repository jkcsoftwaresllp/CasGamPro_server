import BaseGame from "../shared/config/base_game.js";
import { GAME_STATES, GAME_TYPES } from "../shared/config/types.js";

export default class AndarBaharTwoGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    this.gameType = GAME_TYPES.ANDAR_BAHAR_TWO; //workaround for now
    this.jokerCard = null;
    this.players = {
      A: [],
      B: [],
    };
    this.betSides = ["Andar", "Bahar"];
    this.winner = null;
    this.status = GAME_STATES.WAITING;
    this.BETTING_PHASE_DURATION = 20000;
    this.CARD_DEAL_INTERVAL = 1000;
  }

  async firstServe() {
    this.jokerCard = this.deck.shift();
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
