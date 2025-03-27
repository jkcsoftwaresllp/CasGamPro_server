import BaseGame from "../shared/config/base_game.js";
import {
  GAME_CONFIGS,
  GAME_TYPES,
  initializeGameProperties,
} from "../shared/config/types.js";
import { generateLosingHand, generateWinningHand } from "./helper.js";

export default class TeenPattiGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    this.initialize(GAME_TYPES.TEEN_PATTI);
  }

  firstServe() {
    this.blindCard = this.deck.shift();
  }

  determineOutcome(bets) {
    // Determine winner based on bet totals
    const playerATotal = parseFloat(bets.playerA) || 0;
    const playerBTotal = parseFloat(bets.playerB) || 0;

    // Generate hands
    let { winningHand, winningHandRank } = generateWinningHand(this.deck);

    const usedCards = new Set(winningHand);
    const availableCards = this.deck.filter((card) => !usedCards.has(card));

    let { losingHand, winningHand: updatedWinningHand } = generateLosingHand(
      availableCards,
      winningHand,
      winningHandRank
    );

    // Update winningHand with the new value
    winningHand = updatedWinningHand;

    this.winner =
      playerATotal === playerBTotal
        ? Math.random() < 0.5
          ? ["playerA"]
          : ["playerB"]
        : playerATotal < playerBTotal
        ? ["playerA"]
        : ["playerB"];

    // Assign cards directly
    if (this.winner.includes("playerA")) {
      this.players.A = winningHand;
      this.players.B = losingHand;
    } else {
      this.players.A = losingHand;
      this.players.B = winningHand;
    }
  }
}
