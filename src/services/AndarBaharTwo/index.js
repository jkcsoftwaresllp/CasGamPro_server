import BaseGame from "../shared/config/base_game.js";
import { GAME_TYPES } from "../shared/config/types.js";

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
    let myDeck = this.deck.filter((card) => card[1] !== this.jokerCard[1]);
    let winningDeck = this.deck.filter(
      (card) => card[1] === this.jokerCard[1] && card !== this.jokerCard
    );

    const ander = "ander",
      bahar = "bahar";

    // Determine the side with the least bet
    const leastBetSide =
      parseFloat(bets.andar) === parseFloat(bets.bahar)
        ? Math.random() < 0.5
          ? ander
          : bahar
        : parseFloat(bets.andar) < parseFloat(bets.bahar)
        ? ander
        : bahar;

    // 1 -> 5 : A Odd, B -> Even

    const getBiasedRandomNumber = () => {
      let randomFactor = Math.random();
      let biasedValue = Math.floor(Math.pow(randomFactor, 2) * 45);
      return biasedValue;
    };

    let stoppingNumber = getBiasedRandomNumber();

    if (leastBetSide === ander)
      stoppingNumber =
        stoppingNumber % 2 === 0 ? stoppingNumber + 1 : stoppingNumber;
    else
      stoppingNumber =
        stoppingNumber % 2 === 0 ? stoppingNumber : stoppingNumber + 1;

    let currentPosition = "A";

    while (stoppingNumber > 1) {
      let nextCard = myDeck.shift();

      this.players[currentPosition].push(nextCard);
      currentPosition = currentPosition === "A" ? "B" : "A";
      stoppingNumber--;
    }

    const winningCard =
      winningDeck[Math.floor(Math.random() * winningDeck.length)];

    this.players[currentPosition].push(winningCard);

    this.winner = leastBetSide;
  }
}
