import BaseGame from "../shared/config/base_game.js";
import {
  GAME_CONFIGS,
  GAME_TYPES,
  initializeGameProperties,
} from "../shared/config/types.js";
import {
  initializeBetTotals,
  findLeastBetCategory,
  handleDragonTigerCategory,
} from "./helper.js";

export default class DragonTigerGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    const props = initializeGameProperties(GAME_TYPES.DRAGON_TIGER);
    Object.assign(this, props);
  }

  determineOutcome(bets) {
    console.log("received bets:", bets);

    const betTotals = initializeBetTotals(bets);
    this.winner = findLeastBetCategory(betTotals);

    let cards = null;
    if (this.winner === "pair" || this.winner === "tie") {
      cards = handlePairTieCategory(this.winner);
    } else {
      cards = handleDragonTigerCategory(this.winner, betTotals);
    }

    // Set cards directly
    this.blindCard = cards.blindCard;
    this.players.A = [cards.dragonCard];
    this.players.B = [cards.tigerCard];
  }
}
