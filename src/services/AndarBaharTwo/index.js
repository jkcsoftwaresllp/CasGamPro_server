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
    this.initialize(GAME_TYPES.ANDAR_BAHAR_TWO);
  }

  preBetServe() {
    this.jokerCard = this.deck.shift();
    this.display.jokerCard = this.jokerCard;
    this.broadcastGameState();
  }

  firstServe() {
    this.blindCard = this.deck.shift();
  }

  determineOutcome(bets) {
    const compareCards = (card) => {
      const cardRank = card.slice(1);
      const jokerRank = this.jokerCard.slice(1);
      return cardRank === jokerRank;
    };

    // Determine the side with the least bet
    const leastBetSide = !bets.andar
      ? "andar"
      : !bets.bahar
      ? "bahar"
      : parseFloat(bets.andar) < parseFloat(bets.bahar)
      ? "andar"
      : "bahar";
    // console.log(`Least bet side: ${leastBetSide}`);

    // Mapping positions to game sides
    const positionMap = { A: "andar", B: "bahar" };
    let leastBetPosition = Object.keys(positionMap).find(
      (key) => positionMap[key] === leastBetSide
    );
    let oppositePosition = leastBetPosition === "A" ? "B" : "A";

    let currentPosition = "A";
    let foundWinningCard = false;

    while (this.deck.length > 0) {
      let nextCard = this.deck.shift();

      if (compareCards(nextCard) && currentPosition !== leastBetPosition) {
        let tempDeck = [];
        let replacementCard = null;

        while (this.deck.length > 0) {
          let tempCard = this.deck.shift();
          if (!compareCards(tempCard)) {
            replacementCard = tempCard;
            break;
          }
          tempDeck.push(tempCard);
        }

        this.deck.unshift(...tempDeck);

        if (replacementCard) {
          this.players[currentPosition].push(replacementCard);
        }

        continue;
      }

      this.players[currentPosition].push(nextCard);

      if (compareCards(nextCard)) {
        this.winner = leastBetSide;
        foundWinningCard = true;
        break;
      }
      currentPosition = currentPosition === "A" ? "B" : "A";
    }

    if (!foundWinningCard) {
      this.winner = leastBetSide;
    }
  }
}
