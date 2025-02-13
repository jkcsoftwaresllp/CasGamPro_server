import BaseGame from "../shared/config/base_game.js";
import { GAME_TYPES } from "../shared/config/types.js";
import { generateLosingHand, generateWinningHand } from "./methods.js";

export default class TeenPattiGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    this.gameType = GAME_TYPES.TEEN_PATTI; //workaround for now
    this.blindCard = null;
    this.players = {
      A: [],
      B: [],
    };
    this.bettingResults = {
      player1: [],
      player2: [],
    };
    this.winner = null;
    this.BETTING_PHASE_DURATION = 30000; // 30 seconds for betting
    this.CARD_DEAL_DURATION = 5000; // 5 seconds for dealing
    this.betSides = ["playerA", "playerB"];
    this.gameInterval = null;
  }

  async firstServe() {
    this.blindCard = this.deck.shift();
  }

  async determineOutcome(bets) {
    return new Promise((resolve) => {
      const playerATotal = bets.playerA || 0;
      const playerBTotal = bets.playerB || 0;
      const winningPlayer =
        playerATotal <= playerBTotal ? "playerA" : "playerB"; // Bets amount are equal then randomize the result

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
