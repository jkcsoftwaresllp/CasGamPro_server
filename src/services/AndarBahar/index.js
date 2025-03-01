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

  determineOutcome(bets) {
    console.log("Bets: ", bets);
    // Calculate result directly
    // const betTotals = initializeBetTotals(bets);
    // this.winner = findLeastBetSide(bets);
    this.winner = Object.values(findLeastBetSide(bets));
    console.log(this.winner);
    const { cardsForA, cardsForB } = handleCardDistribution(this.winner);
    console.log("Cards for A: ", cardsForA);
console.log("Cards for B: ", cardsForB);

    // Assign cards directly to players
    this.players.A = cardsForA;
    this.players.B = cardsForB;
  }
}
