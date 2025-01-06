import redis from "../../../config/redis.js";
import { GAME_STATES } from "./types.js";

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

    this.recoverState();
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

  /* ABSTRACT FUNCTIONS */
  start() {
    throw new Error("Start method must be implemented");
  }
  end() {
    throw new Error("End method must be implemented");
  }
  logSpecificGameState() {}

  async saveState() {
    try {
      await redis.hmset(`game:${this.gameId}`, {
        status: this.status,
        startTime: this.startTime,
        winner: this.winner || "",
        deck: JSON.stringify(this.deck),
      });
    } catch (error) {
      console.error(`Failed to save game state for ${this.gameId}:`, error);
    }
  }

  async recoverState() {
    try {
      const state = await redis.hgetall(`game:${this.gameId}`);
      if (state && Object.keys(state).length) {
        this.status = state.status;
        this.startTime = state.startTime;
        this.winner = state.winner || null;
        this.deck = JSON.parse(state.deck);
      }
    } catch (error) {
      console.error(`Failed to recover game state for ${this.gameId}:`, error);
    }
  }

  async clearState() {
    try {
      await redis.del(`game:${this.gameId}`);
    } catch (error) {
      console.error(`Failed to clear game state for ${this.gameId}:`, error);
    }
  }

  logGameState(event) {
    console.log(`\n=== ${this.gameId} - ${event} ===`);
    console.log("Type:", this.constructor.name);
    console.log("Status:", this.status);
    console.log("Winner:", this.winner);
    this.logSpecificGameState(); // Implemented by child classes
    console.log("Time:", new Date().toLocaleTimeString());
    console.log("===============================\n");
  }
}

export default BaseGame;
