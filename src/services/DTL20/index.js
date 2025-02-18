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
    const props = initializeGameProperties(GAME_TYPES.DRAGON_TIGER_LION);
    Object.assign(this, props);
  }

  async firstServe() {
    this.blindCard = this.deck.shift();
  }

  async determineOutcome(bets) {
    return new Promise((resolve) => {
      const leastBetCategory = findLeastBetCategory(bets);

      const threeCards = generateThreeCards(leastBetCategory.evenOdd);

      const { win, loss1, loss2 } = cardsWithSuit(
        threeCards,
        leastBetCategory.redBlack
      );

      const prefix = leastBetCategory.player.slice(0, 1).toUpperCase();

      const winner = {
        player: leastBetCategory.player,
        evenOdd:
          leastBetCategory.evenOdd === "even" ? `${prefix}E` : `${prefix}O`,
        redBlack:
          leastBetCategory.redBlack === "red" ? `${prefix}R` : `${prefix}B`,
      };

      // console.log({ win, loss1, loss2 });

      let count = 0;
      const players = ["A", "B", "C"]; // Representing the players
      const winnerList = [winner.player, winner.evenOdd, winner.redBlack];

      const dealingInterval = setInterval(() => {
        if (count === 3) {
          clearInterval(dealingInterval);
          this.winner = winnerList;
          resolve();
          return;
        }

        // Get the current player based on count
        const currentPlayer = players[count];

        // Deal cards based on the winner
        if (this.winner === "dragon") {
          this.players[currentPlayer] =
            currentPlayer === "A" ? win : currentPlayer === "B" ? loss1 : loss2;
        } else if (this.winner === "tiger") {
          this.players[currentPlayer] =
            currentPlayer === "B" ? win : currentPlayer === "A" ? loss1 : loss2;
        } else {
          this.players[currentPlayer] =
            currentPlayer === "C" ? win : currentPlayer === "A" ? loss1 : loss2;
        }

        count++; // Move to the next player
      }, this.CARD_DEAL_INTERVAL);
    });
  }
}
