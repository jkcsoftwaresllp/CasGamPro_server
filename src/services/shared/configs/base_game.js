import {GAME_STATES} from "./types.js";

class BaseGame {
  constructor(gameId) {
    this.gameId = gameId;
    this.status = GAME_STATES.WAITING;
    this.startTime = null;
    this.winner = null;
    this.deck = this.initializeDeck();
    this.gameInterval = null;
    this.BETTING_PHASE_DURATION = 30000;
    this.CARD_DEAL_INTERVAL = 500;
  }

  initializeDeck() {
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A",];
    let deck = [];
    for (let i = 0; i < 4; i++) {
      deck = deck.concat(ranks);
    }
    return deck.sort(() => Math.random() - 0.5);
  }

  /* ABSTRACT FUNCTIONS */
  start() {
    throw new Error("Start method must be implemented");
  }
  end() {
    throw new Error("End method must be implemented");
  }
  logSpecificGameState() {}

  logGameState(event) {
    console.log(`\n=== ${this.gameId} - ${event} ===`);
    console.log("Type:", this.constructor.name);
    console.log("Status:", this.status);
    this.logSpecificGameState(); // Implemented by child classes
    console.log("Time:", new Date().toLocaleTimeString());
    console.log("===============================\n");
  }

}

export default BaseGame;
