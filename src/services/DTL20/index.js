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

      this.winner = leastBetCategory.player;

      // console.log({ win, loss1, loss2 });

      if (this.winner === "dragon") {
        this.players.A = win;
        this.players.B = loss1;
        this.players.C = loss2;
      } else if (this.winner === "tiger") {
        this.players.A = loss1;
        this.players.B = win;
        this.players.C = loss2;
      } else {
        this.players.A = loss1;
        this.players.B = loss2;
        this.players.C = win;
      }

      this.end();
    });
  }
}
