import BaseGame from "../shared/config/base_game.js";
import {
  GAME_CONFIGS,
  GAME_STATES,
  GAME_TYPES,
  initializeGameProperties,
} from "../shared/config/types.js";

export default class AndarBaharTwoGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    const props = initializeGameProperties(GAME_TYPES.ANDAR_BAHAR_TWO);
    Object.assign(this, props);
  }

  async firstServe() {
    this.jokerCard = this.deck.shift();
  }

  async determineOutcome(bets) {
    return new Promise((resolve) => {
      const playerATotal = bets.andar || 0;
      const playerBTotal = bets.bahar || 0;

      // Determine the winning player
      const winningPlayer =
        playerATotal === playerBTotal
          ? Math.random() < 0.5
            ? "andar"
            : "bahar"
          : playerATotal < playerBTotal
          ? "andar"
          : "bahar";

      let currentPosition = "A"; // First card to Player A
      let deck = this.deck;
      const jokerRank = this.jokerCard.slice(1);

      // Find all cards in the deck that match the joker rank
      const winningCards = deck.filter((card) => jokerRank === card.slice(1));
      const winningIndex = Math.floor(Math.random() * winningCards.length);
      const winningCard = winningCards[winningIndex];

      // Remove the Joker Rank from the deck
      deck = deck.filter((card) => jokerRank !== card.slice(1));
      let randomNumber = Math.floor(Math.random() * deck.length);

      // Check where the winning card will land
      let winningCardPosition = randomNumber % 2 === 0 ? "A" : "B";

      // If the winning card's final position does NOT match the expected winner, adjust
      if (
        (winningPlayer === "andar" && winningCardPosition !== "A") ||
        (winningPlayer === "bahar" && winningCardPosition !== "B")
      ) {
        if (randomNumber + 1 < deck.length) {
          randomNumber += 1; // Move position forward
        } else {
          randomNumber -= 1; // Move position backward
        }
      }

      // Insert the winning card into the correct position
      deck.splice(randomNumber, deck.length - randomNumber, winningCard);

      // console.log({
      //   playerATotal,
      //   playerBTotal,
      //   jokerRank,
      //   randomNumber,
      //   winningCards,
      //   winningIndex,
      //   winningCard,
      //   winningPlayer,
      //   winningCardPosition,
      //   deck,
      // });

      let cardCount = 0;

      const dealingInterval = setInterval(() => {
        if (this.deck.length === 0) {
          clearInterval(dealingInterval);
          this.winner = winningPlayer;
          resolve();
          return;
        }

        const nextCard = this.deck.shift();
        this.players[currentPosition].push(nextCard);

        currentPosition = currentPosition === "A" ? "B" : "A";
        cardCount++;
      }, this.CARD_DEAL_INTERVAL);
    });
  }
}
