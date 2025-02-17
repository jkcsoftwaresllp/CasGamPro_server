import BaseGame from "../shared/config/base_game.js";
import {
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

  async firstServe() {
    this.blindCard = this.deck.shift();
  }

  async determineOutcome(bets) {

    return new Promise((resolve) => {
      const playerATotal = bets.playerA || 0;
      const playerBTotal = bets.playerB || 0;

      const winningPlayer =
        playerATotal === playerBTotal
          ? Math.random() < 0.5
            ? "playerA"
            : "playerB"
          : playerATotal < playerBTotal
          ? "playerA"
          : "playerB";

      const winningHand = generateWinningHand(this.deck);
      const losingHand = generateLosingHand(this.deck, winningHand);

      let cardIndex = 0;
      let currentPlayer = "A";

      const dealingInterval = setInterval(() => {
        if (cardIndex >= 3) {
          this.winner = winningPlayer;
          clearInterval(dealingInterval);
          resolve();
          return;
        }

        if (winningPlayer === "playerA") {
          this.players[currentPlayer].push(
            currentPlayer === "A"
              ? winningHand[cardIndex]
              : losingHand[cardIndex]
          );
        } else {
          this.players[currentPlayer].push(
            currentPlayer === "A"
              ? losingHand[cardIndex]
              : winningHand[cardIndex]
          );
        }

        currentPlayer = currentPlayer === "A" ? "B" : "A";

        if (currentPlayer === "A") {
          cardIndex++;
        }
      }, this.CARD_DEAL_INTERVAL);
    });
  }
}
