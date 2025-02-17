import BaseGame from "../shared/config/base_game.js";
import {
  GAME_TYPES,
  GAME_CONFIGS,
  initializeGameProperties,
} from "../shared/config/types.js";
import { generateLosingHand, generateWinnerHand } from "./helper.js";

export default class DTLGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    const props = initializeGameProperties(GAME_TYPES.DRAGON_TIGER_LION);
    Object.assign(this, props);
  }

  async firstServe() {
    this.blindCard = this.deck.shift();
  }

  async determineOutcome(bets) {
    return new Promise((resolve) => {
      const betResults = {
        dragon: bets.dragon || 0,
        tiger: bets.tiger || 0,
        lion: bets.lion || 0,
      };

      const winner = Object.keys(betResults).reduce((a, b) =>
        betResults[a] < betResults[b] ? a : b
      );

      this.winner = Object.keys(betResults).reduce((a, b) =>
        betResults[a] < betResults[b] ? a : b
      );

      const winningHand = generateWinnerHand(this.deck, this.winner);
      const losingHands = this.betSides
        .filter((side) => side !== this.winner)
        .map((side) => generateLosingHand(this.deck, winningHand));

      if (this.winner === "dragon") {
        this.players.A = winningHand;
        this.players.B = losingHands[0];
        this.players.C = losingHands[1];
      } else if (this.winner === "tiger") {
        this.players.A = losingHands[0];
        this.players.B = winningHand;
        this.players.C = losingHands[1];
      } else {
        this.players.A = losingHands[0];
        this.players.B = losingHands[1];
        this.players.C = winningHand;
      }

      this.end();
    });
  }
}
