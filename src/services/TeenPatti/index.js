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
    const props = initializeGameProperties(GAME_TYPES.TEEN_PATTI);
    Object.assign(this, props);
  }

  firstServe() {
    this.blindCard = this.deck.shift();
  }

  determineOutcome(bets) {
    // Determine winner based on bet totals
    const playerATotal = bets.playerA || 0;
    const playerBTotal = bets.playerB || 0;
    this.winner = playerATotal <= playerBTotal ? ["playerA"] : ["playerB"];

    // Generate hands
    const winningHand = generateWinningHand(this.deck);
    const losingHand = generateLosingHand(this.deck, winningHand);

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
