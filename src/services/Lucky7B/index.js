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

export default class Lucky7BGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    this.initialize(GAME_TYPES.LUCKY7B);
  }

  firstServe() {
    this.blindCard = this.deck.shift();
  }

  determineOutcome(bets) {
    // Determine the least bet category and get the appropriate card
    const leastBets = getLeastBetWithValidation(bets);
    // console.log("Least Bets Chosen:", leastBets);
    const narrowedCards = narrowDownCards(leastBets);
    // console.log("Narrowed Down Cards:", narrowedCards);
    const selectedCard = selectRandomCard(narrowedCards);
    // console.log("Selected Card:", selectedCard);

    // Determine the winning category based on the selected card
    const winningCategory = determineWinningCategory(selectedCard);
    // console.log("Winning Category:", winningCategory);

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
