import BaseGame from "../shared/config/base_game.js";
import {
  GAME_TYPES,
  initializeGameProperties,
} from "../shared/config/types.js";
import {
  determineWinningCategory,
  narrowDownCards,
  selectRandomCard,
  getLeastBetWithValidation,
} from "./helper.js";

export default class Lucky7AGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    const props = initializeGameProperties(GAME_TYPES.LUCKY7A);
    Object.assign(this, props);
  }

  firstServe() {
    this.blindCard = this.deck.shift();
  }

  determineOutcome(bets) {
    // Determine the least bet category and get the appropriate card
    const leastBets = getLeastBetWithValidation(bets);
    const narrowedCards = narrowDownCards(leastBets);
    const selectedCard = selectRandomCard(narrowedCards);

    // Determine the winning category based on the selected card
    const winningCategory = determineWinningCategory(selectedCard);

    // Assign the cards to players based on the rank
    const rank = selectedCard.slice(1);
    const numRank = isNaN(parseInt(rank))
      ? rank === "A"
        ? 1
        : rank === "J"
        ? 11
        : rank === "Q"
        ? 12
        : rank === "K"
        ? 13
        : 7
      : parseInt(rank);

    // Assign the winning and losing hands based on the card's rank
    if (numRank < 7) {
      this.players.A.push(selectedCard);
    } else if (numRank > 7) {
      this.players.A.push(selectedCard);
    } else {
      this.players.C.push(selectedCard);
    }

    // Assign the winner based on the selected card's category
    this.winner = winningCategory;
  }
}
