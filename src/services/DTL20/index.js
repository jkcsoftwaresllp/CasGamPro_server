import BaseGame from "../shared/config/base_game.js";
import { GAME_TYPES, GAME_CONFIGS, initializeGameProperties } from "../shared/config/types.js";
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
      
      console.log("betResults", bets);

      const winner = Object.keys(betResults).reduce((a, b) => betResults[a] < betResults[b] ? a : b, );

      // Get single cards instead of arrays
      const winningCard = generateWinnerHand(this.deck, winner);
      const losingCards = this.betSides.filter((side) => side !== winner).map((side) => generateLosingHand(this.deck, winningCard)[0]); // Take first card from losing hands

      let currentPlayer = "A";

      const dealingInterval = setInterval(() => {
        // If all players have their cards
        if (
          this.players.A.length === 1 &&
          this.players.B.length === 1 &&
          this.players.C.length === 1
        ) {
          // Set the final winner
          this.winner = winner === "dragon" ? "dragon" : winner === "tiger" ? "tiger" : "lion";
          clearInterval(dealingInterval);
          resolve();
          return;
        }

        // Deal single card based on winner
        if (winner === "dragon") {
          if (currentPlayer === "A") this.players.A.push(winningCard);
          else if (currentPlayer === "B") this.players.B.push(losingCards[0]);
          else this.players.C.push(losingCards[1]);
        } else if (winner === "tiger") {
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
        currentPlayer = currentPlayer === "A" ? "B" : currentPlayer === "B" ? "C" : "A";
      }, this.CARD_DEAL_INTERVAL);
    });
  }
}
