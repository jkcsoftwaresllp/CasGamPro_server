import BaseGame from "../shared/config/base_game.js";
import {
  GAME_TYPES,
  initializeGameProperties,
} from "../shared/config/types.js";
import { findLeastBetSide, handleCardDistribution } from "./helper.js";

export default class AndarBaharGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    const props = initializeGameProperties(GAME_TYPES.ANDAR_BAHAR);
    Object.assign(this, props);
  }

  determineOutcome(bets) {
    const leastCatagorie = findLeastBetSide(bets);
    this.winner = Object.entries(leastCatagorie).map(
      ([key, value]) => `${value}${key}`
    );

    const { cardsForA, cardsForB } = handleCardDistribution(leastCatagorie);
    // Assign cards directly to players
    this.players.A = cardsForA;
    this.players.B = cardsForB;
  }
}
