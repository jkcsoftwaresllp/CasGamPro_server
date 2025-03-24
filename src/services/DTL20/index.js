import BaseGame from "../shared/config/base_game.js";
import {
  GAME_TYPES,
  initializeGameProperties,
} from "../shared/config/types.js";
import {
  cardsWithSuit,
  findLeastBetCategory,
  generateThreeCards,
} from "./helper.js";

export default class DTLGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    this.initialize(GAME_TYPES.DRAGON_TIGER_LION);
  }

  async firstServe() {
    this.blindCard = this.deck.shift();
  }

  determineOutcome(bets) {
    // Find the least bet category
    const leastBetCategory = findLeastBetCategory(bets);

    // Generate the three cards (winner and two losers)
    const threeCards = generateThreeCards(leastBetCategory.evenOdd);

    // Attach suits to the generated cards
    const { win, loss1, loss2 } = cardsWithSuit(
      threeCards,
      leastBetCategory.redBlack
    );

    // Define the winner object
    const prefix = leastBetCategory.player.slice(0, 1).toUpperCase();
    const winner = {
      player: leastBetCategory.player,
      evenOdd:
        leastBetCategory.evenOdd === "even" ? `${prefix}E` : `${prefix}O`,
      redBlack:
        leastBetCategory.redBlack === "red" ? `${prefix}R` : `${prefix}B`,
    };

    // Directly assign the winner and loser cards to the players
    if (leastBetCategory.player === "dragon") {
      this.players.A = [win];
      this.players.B = [loss1];
      this.players.C = [loss2];
    } else if (leastBetCategory.player === "tiger") {
      this.players.A = [loss1];
      this.players.B = [win];
      this.players.C = [loss2];
    } else if (leastBetCategory.player === "lion") {
      this.players.A = [loss1];
      this.players.B = [loss2];
      this.players.C = [win];
    }

    // Set the winner for the game
    this.winner = [winner.player, winner.evenOdd, winner.redBlack];
  }
}
