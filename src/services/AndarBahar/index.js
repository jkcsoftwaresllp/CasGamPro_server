import { gameManager } from "../common/GameManager/index.js";

class AndarBaharGame {
  constructor(gameId) {
    this.gameId = gameId;
    this.status = "waiting";
    this.jokerCard = null;
    this.andarCards = [];
    this.baharCards = [];
    this.winner = null;
    this.deck = this.initializeDeck();
    this.gameInterval = null;
    this.BETTING_PHASE_DURATION = 30000; // 30 seconds
    this.CARD_DEAL_INTERVAL = 500; // 500ms between each card
  }

  initializeDeck() {
    const ranks = [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
      "A",
    ];
    let deck = [];
    for (let i = 0; i < 4; i++) {
      deck = deck.concat(ranks);
    }
    return deck.sort(() => Math.random() - 0.5);
  }

  start() {
    this.status = "betting";
    this.startTime = Date.now();

    this.logGameState("Game Started - Betting Phase");

    // Betting phase
    this.gameInterval = setTimeout(() => {
      this.startDealing();
    }, this.BETTING_PHASE_DURATION);
  }

  startDealing() {
    this.status = "dealing";
    this.jokerCard = this.deck.shift();

    this.logGameState("Dealing Phase Started");

    this.dealCards();
  }

  dealCards() {
    const dealInterval = setInterval(() => {
      if (this.winner) {
        clearInterval(dealInterval);
        this.endGame();
        return;
      }

      if (this.andarCards.length <= this.baharCards.length) {
        const card = this.deck.shift();
        this.andarCards.push(card);
        if (card === this.jokerCard) this.winner = "Andar";
      } else {
        const card = this.deck.shift();
        this.baharCards.push(card);
        if (card === this.jokerCard) this.winner = "Bahar";
      }

      this.logGameState("Card Dealt");
    }, this.CARD_DEAL_INTERVAL);
  }

  endGame() {
    this.status = "completed";
    this.logGameState("Game Completed");

    // Start new game after 5 seconds
    setTimeout(() => {
      const newGame = gameManager.createNewGame(this.gameId.split("_")[0]);
      gameManager.activeGames.delete(this.gameId);
      newGame.start();
    }, 5000);
  }

  logGameState(event) {
    console.log(`\n=== ${this.gameId} - ${event} ===`);
    console.log("Status:", this.status);
    console.log("Joker Card:", this.jokerCard);
    console.log("Andar Cards:", this.andarCards.join(", "));
    console.log("Bahar Cards:", this.baharCards.join(", "));
    if (this.winner) console.log("Winner:", this.winner);
    console.log("Time:", new Date().toLocaleTimeString());
    console.log("===============================\n");
  }
}

export default AndarBaharGame;
