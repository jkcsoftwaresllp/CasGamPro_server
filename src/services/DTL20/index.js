import BaseGame from "../shared/config/base_game.js";
import {
  GAME_TYPES,
  initializeGameProperties,
} from "../shared/config/types.js";
import { generateLosingHand, generateWinnerHand } from "./helper.js";

export default class DTLGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    const props = initializeGameProperties(GAME_TYPES.DRAGON_TIGER_LION);
    Object.assign(this, props);
  }

  firstServe() {
    this.blindCard = this.deck.shift();
  }

  determineOutcome(bets) {
    const betResults = {
      dragon: bets.dragon || 0,
      tiger: bets.tiger || 0,
      lion: bets.lion || 0,
    };

    console.log("betResults", bets);

    // Determine winner
    this.winner = Object.keys(betResults).reduce((a, b) =>
      betResults[a] < betResults[b] ? a : b,
    );

    // Generate cards
    const winningCard = generateWinnerHand(this.deck, this.winner);
    const losingCards = this.betSides
      .filter((side) => side !== this.winner)
      .map((side) => generateLosingHand(this.deck, winningCard)[0]);

    // Assign cards directly based on winner
    if (winner === "dragon") {
      this.players.A = [winningCard];
      this.players.B = [losingCards[0]];
      this.players.C = [losingCards[1]];
    } else if (winner === "tiger") {
      this.players.A = [losingCards[0]];
      this.players.B = [winningCard];
      this.players.C = [losingCards[1]];
    } else {
      // lion
      this.players.A = [losingCards[0]];
      this.players.B = [losingCards[1]];
      this.players.C = [winningCard];
    }
  }
}
