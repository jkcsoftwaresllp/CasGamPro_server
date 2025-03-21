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
    this.initialize(GAME_TYPES.DRAGON_TIGER_TWO);
  }

  async firstServe() {
    return;
  }

  determineOutcome(bets) {
    // Find the category with the least bet
    const leastBetCategory = findLeastBetCategory(bets);
    let winnerList;

    // Generate cards and determine winner
    let cards = null;
    if (leastBetCategory === "pair" || leastBetCategory === "tie") {
      cards = handlePairTieCategory(leastBetCategory);
      winnerList = [leastBetCategory]; // In case of pair or tie, the category itself is the winner
    } else {
      cards = handleDragonTigerCategory(leastBetCategory, bets);
      const prefix = leastBetCategory.slice(0, 1).toUpperCase();
      const { player, evenOdd, redBlack, card } = cards.winner;

      // Add the winner details for dragon or tiger, even/odd, and red/black
      winnerList = [
        player,
        `${prefix}${evenOdd}`,
        `${prefix}${redBlack}`,
        card,
      ];
    }

    // Randomize the outcome if no stake is placed
    if (!bets || Object.keys(bets).length === 0) {
      const outcomes = ["tie", "pair", "dragon", "tiger"];
      const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      if (randomOutcome === "tie" || randomOutcome === "pair") {
        cards = handlePairTieCategory(randomOutcome);
        winnerList = [randomOutcome];
      } else {
        cards = handleDragonTigerCategory(randomOutcome, bets);
        const prefix = randomOutcome.slice(0, 1).toUpperCase();
        const { player, evenOdd, redBlack, card } = cards.winner;
        winnerList = [
          player,
          `${prefix}${evenOdd}`,
          `${prefix}${redBlack}`,
          card,
        ];
      }
    }
    
     this.winner = winnerList;
    // Assign the cards to the players
    if (this.winner.includes("dragon")) {
      this.players.A = [cards.dragonCard];
      this.players.B = [cards.tigerCard];
    } else {
      this.players.A = [cards.tigerCard];
      this.players.B = [cards.dragonCard];
    }

    // Assign blind card
    this.blindCard = cards.blindCard;
  }
}
