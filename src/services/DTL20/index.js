import BaseGame from "../shared/config/base_game.js";
import { GAME_TYPES } from "../shared/config/types.js";
import { generateLosingHand, generateWinnerHand } from "./helper.js";

export default class DTLGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    this.gameType = GAME_TYPES.DRAGON_TIGER_LION;
    this.blindCard = null;
    this.players = {
      A: [], // Dragon cards
      B: [], // Tiger cards
      C: [], // Lion cards
    };
    this.bettingResults = {
      dragon: [],
      tiger: [],
      lion: [],
    };
    this.winner = null;
    this.BETTING_PHASE_DURATION = 2000;
    this.CARD_DEAL_DURATION = 5000;
    this.betSides = ["dragon", "tiger", "lion"];
    this.gameInterval = null;
  }

  async firstServe() {
    //this.deck = await this.shuffleDeck();
    this.players.A = [this.deck.shift()];
    this.players.B = [this.deck.shift()];
    this.players.C = [this.deck.shift()];
    this.blindCard = this.deck.shift();
  }

  async determineOutcome(bets) {
    return new Promise((resolve) => {
      const betResults = {
        dragon: bets.dragon || 0,
        tiger: bets.tiger || 0,
        lion: bets.lion || 0,
      };

      this.winner = Object.keys(betResults).reduce((a, b) =>
        betResults[a] < betResults[b] ? a : b,
      );

      // Get single cards instead of arrays
      const winningCard = generateWinnerHand(this.deck, this.winner);
      const losingCards = this.betSides
        .filter((side) => side !== this.winner)
        .map((side) => generateLosingHand(this.deck, winningCard)[0]); // Take first card from losing hands

      let currentPlayer = "A";

      const dealingInterval = setInterval(() => {
        // If all players have their cards
        if (
          this.players.A.length === 1 &&
          this.players.B.length === 1 &&
          this.players.C.length === 1
        ) {
          // Set the final winner
          this.winner =
            this.winner === "dragon"
              ? "dragon"
              : this.winner === "tiger"
                ? "tiger"
                : "lion";
          clearInterval(dealingInterval);
          resolve();
          return;
        }

        // Deal single card based on winner
        if (this.winner === "dragon") {
          if (currentPlayer === "A") this.players.A.push(winningCard);
          else if (currentPlayer === "B") this.players.B.push(losingCards[0]);
          else this.players.C.push(losingCards[1]);
        } else if (this.winner === "tiger") {
          if (currentPlayer === "A") this.players.A.push(losingCards[0]);
          else if (currentPlayer === "B") this.players.B.push(winningCard);
          else this.players.C.push(losingCards[1]);
        } else {
          // lion
          if (currentPlayer === "A") this.players.A.push(losingCards[0]);
          else if (currentPlayer === "B") this.players.B.push(losingCards[1]);
          else this.players.C.push(winningCard);
        }

        // Rotate between players
        currentPlayer =
          currentPlayer === "A" ? "B" : currentPlayer === "B" ? "C" : "A";
      }, this.CARD_DEAL_INTERVAL);
    });
  }
}
