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
import { logger } from "../../logger/logger.js"; // Import the logger

const GAME_INDEX = 4;


export default class AndarBaharGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    this.gameType = GAME_CONFIGS[GAME_INDEX].type;
    this.jokerCard = null;
    this.players = {
      A: [],
      B: [],
    };
    this.betSides = GAME_CONFIGS[GAME_INDEX].betOptions;
    this.winner = null;
    this.status = GAME_STATES.WAITING;
    this.BETTING_PHASE_DURATION = GAME_CONFIGS[GAME_INDEX].bettingDuration;
    this.CARD_DEAL_INTERVAL = GAME_CONFIGS[GAME_INDEX].cardDealInterval;

  }

	async firstServe() {

  }

	async determineOutcome(bets) {
    return new Promise((resolve) => {
      const betTotals = initializeBetTotals(bets);
      const leastBetSide = findLeastBetSide(betTotals);
      const { cardsForA, cardsForB } = handleCardDistribution(leastBetSide);

      let currentPosition = "A";
      let cardIndexA = 0;
      let cardIndexB = 0;

      const dealingInterval = setInterval(() => {
        // If all cards have been dealt
        if (cardIndexA >= cardsForA.length && cardIndexB >= cardsForB.length) {
          this.winner = leastBetSide;
          clearInterval(dealingInterval);
          resolve();
          return;
        }

        // Deal card to current position
        if (currentPosition === "A" && cardIndexA < cardsForA.length) {
          this.players.A.push(cardsForA[cardIndexA]);
          cardIndexA++;
        } else if (currentPosition === "B" && cardIndexB < cardsForB.length) {
          this.players.B.push(cardsForB[cardIndexB]);
          cardIndexB++;
        }

        // Switch positions
        currentPosition = currentPosition === "A" ? "B" : "A";
      }, this.CARD_DEAL_INTERVAL);
    });
  }
}
