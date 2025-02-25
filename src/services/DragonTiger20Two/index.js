import BaseGame from "../shared/config/base_game.js";
import {
  GAME_TYPES,
  initializeGameProperties,
} from "../shared/config/types.js";

import {
  findLeastBetCategory,
  handleDragonTigerCategory,
  handlePairTieCategory,
} from "./helper.js";

export default class DragonTigerTwoGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    const props = initializeGameProperties(GAME_TYPES.DRAGON_TIGER_TWO);
    Object.assign(this, props);
  }

  async firstServe() {
    return;
  }

  determineOutcome(bets) {
      console.log("received bets:", bets);
      this.winner = findLeastBetCategory(bets);
  
      let cards = null;
      if (this.winner === "pair" || this.winner === "tie") {
        cards = handlePairTieCategory(this.winner);
      } else {
        cards = handleDragonTigerCategory(this.winner, bets);
      }
  
      // Set cards directly
      this.blindCard = cards.blindCard;
      this.players.A = [cards.dragonCard];
      this.players.B = [cards.tigerCard];
    }
}
