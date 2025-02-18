import BaseGame from "../shared/config/base_game.js";
import {
  GAME_CONFIGS,
  GAME_STATES,
  GAME_TYPES,
  initializeGameProperties,
} from "../shared/config/types.js";
import { getMinValueKeys } from "../shared/helper/getMinValueKeys.js";
import { findLeastBetSide, handleCardDistribution } from "./helper.js";
import { logger } from "../../logger/logger.js"; // Import the logger

export default class AndarBaharGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    const props = initializeGameProperties(GAME_TYPES.ANDAR_BAHAR);
    Object.assign(this, props);
  }

  async firstServe() {}

  async determineOutcome(bets) {
    return new Promise((resolve) => {
      const leastBetSide = findLeastBetSide(bets);
      const { cardsForA, cardsForB } = handleCardDistribution(leastBetSide);

      // console.log({ leastBetSide, cardsForA, cardsForB });

      let currentPosition = "A";
      let cardIndexA = 0;
      let cardIndexB = 0;

      function convertDictToArray(dict) {
        return Object.entries(dict).map(([key, value]) => `${value}${key}`);
      }

      const dealingInterval = setInterval(() => {
        // If all cards have been dealt
        if (cardIndexA >= cardsForA.length && cardIndexB >= cardsForB.length) {
          this.winner = convertDictToArray(leastBetSide);
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
