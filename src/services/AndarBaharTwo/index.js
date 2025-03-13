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

  preBetServe() {
    this.jokerCard = this.deck.shift();
    this.display.jokerCard = this.jokerCard;
    this.broadcastGameState();
  }

  firstServe() {
    this.blindCard = this.deck.shift();
  }

  determineOutcome(bets) {
    const compareCards = (card) => {
      const cardRank = card.slice(1);
      const jokerRank = this.jokerCard.slice(1);
      return cardRank === jokerRank;
    };

    // Determine the side with the least bet
    const leastBetSide = bets.andar < bets.bahar ? "andar" : "bahar";
    // console.log(`Least bet side: ${leastBetSide}`);

    // Keep dealing cards alternately until we find a match or run out of cards
    let currentPosition = "A";
    while (this.deck.length > 0) {
      const nextCard = this.deck.shift();
      this.players[currentPosition].push(nextCard);

      if (compareCards(nextCard)) {
        this.winner = leastBetSide;
        break;
      }

      currentPosition = currentPosition === "A" ? "B" : "A";
    }

    if (!this.winner && this.deck.length === 0) {
      this.winner = leastBetSide;
    }
  }
}
