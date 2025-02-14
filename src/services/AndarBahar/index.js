import BaseGame from "../shared/config/base_game.js";
import {
  GAME_CONFIGS,
  GAME_STATES,
  GAME_TYPES,
} from "../shared/config/types.js";
import { getMinValueKeys } from "../shared/helper/getMinValueKeys.js";
import {
  initializeBetTotals,
  findLeastBetSide,
  handleCardDistribution,
} from "./helper.js";

export default class AndarBaharGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    this.gameType = GAME_TYPES.ANDAR_BAHAR; //workaround for now
    this.jokerCard = null;
    this.players = {
      A: [],
      B: [],
    };
    this.betSides = GAME_CONFIGS[4].betOptions;
    this.winner = null;
    this.status = GAME_STATES.WAITING;
    this.BETTING_PHASE_DURATION = 2000; // Example value
    this.CARD_DEAL_INTERVAL = 3000; // Example value
  }

  async firstServe() {
    this.currentRoundCards = [];
    this.winner = null;
  }

  async determineOutcome(bets) {
    // Initialize bet totals first
    const betTotals = initializeBetTotals(bets);

    // Get least bet side using bet totals
    const leastBetSide = findLeastBetSide(betTotals);

    // Pass both leastBetSide and betTotals to handleCardDistribution
    let distributedCards = handleCardDistribution(leastBetSide, betTotals);

    // Set winner and distribute cards
    this.winner = leastBetSide;
    this.currentRoundCards = distributedCards;

    // Deal cards alternately using setInterval like other games
    return new Promise((resolve) => {
      let currentPosition = "A";
      let cardIndex = 0;

      const dealingInterval = setInterval(() => {
        if (cardIndex >= distributedCards.length) {
          clearInterval(dealingInterval);
          resolve();
          return;
        }

        const currentCard = distributedCards[cardIndex];

        // Push cards to appropriate side
        if (currentPosition === "A") {
          this.players.A.push(currentCard);
        } else {
          this.players.B.push(currentCard);
        }

        // Switch sides and increment card index
        currentPosition = currentPosition === "A" ? "B" : "A";
        cardIndex++;
      }, this.CARD_DEAL_INTERVAL);
    });
  }
}
