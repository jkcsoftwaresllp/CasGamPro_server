// noinspection SpellCheckingInspection

import redis from "../../config/redis.js";
import gameManager from "../shared/configs/manager.js";
import BaseClass from "../shared/configs/base_game.js";
import { GAME_STATES, GAME_TYPES } from "../shared/configs/types.js";

class AndarBaharGame extends BaseClass {
  constructor(gameId) {
    super(gameId);
    this.jokerCard = null;
    this.andarCards = [];
    this.baharCards = [];
  }

  logSpecificGameState() {
    console.log("Joker Card:", this.jokerCard);
    console.log("Andar Cards:", this.andarCards.join(", "));
    console.log("Bahar Cards:", this.baharCards.join(", "));
  }

  async saveState() {
    try {
      await super.saveState(); // Save base state
      await redis.hmset(`game:${this.gameId}:andarbahar`, {
        jokerCard: this.jokerCard || "",
        andarCards: JSON.stringify(this.andarCards),
        baharCards: JSON.stringify(this.baharCards),
      });
    } catch (error) {
      console.error(
        `Failed to save AndarBahar state for ${this.gameId}:`,
        error,
      );
    }
  }

  async recoverState() {
    try {
      await super.recoverState(); // Recover base state
      const state = await redis.hgetall(`game:${this.gameId}:andarbahar`);
      if (state && Object.keys(state).length) {
        this.jokerCard = state.jokerCard || null;
        this.andarCards = JSON.parse(state.andarCards);
        this.baharCards = JSON.parse(state.baharCards);
      }
    } catch (error) {
      console.error(
        `Failed to recover AndarBahar state for ${this.gameId}:`,
        error,
      );
    }
  }

  async start() {
    this.status = GAME_STATES.BETTING;
    this.startTime = Date.now();
    await this.saveState();

    this.logGameState("Game Started - Betting Phase");

    this.gameInterval = setTimeout(async () => {
      await this.startDealing();
    }, this.BETTING_PHASE_DURATION);
  }

  async startDealing() {
    this.status = GAME_STATES.DEALING;
    this.jokerCard = this.deck.shift();
    await this.saveState();

    this.logGameState("Dealing Phase Started");
    await this.dealCards();
  }

  async dealCards() {
    const dealInterval = setInterval(async () => {
      if (this.winner) {
        clearInterval(dealInterval);
        await this.endGame();
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

      await this.saveState();
      this.logGameState("Card Dealt");
    }, this.CARD_DEAL_INTERVAL);
  }

  async endGame() {
    this.status = GAME_STATES.COMPLETED;
    await this.saveState();

    // Store game result in history
    await this.storeGameResult();

    this.logGameState("Game Completed");

    setTimeout(async () => {
      try {
        await this.clearState();
        // Await the new game creation
        const newGame = await gameManager.startNewGame(GAME_TYPES.ANDAR_BAHAR);
        gameManager.activeGames.delete(this.gameId);
        // Start the new game
        await newGame.start();
      } catch (error) {
        console.error("Failed to start new game:", error);
      }
    }, 5000);
  }

  async storeGameResult() {
    try {
      const result = {
        gameId: this.gameId,
        winner: this.winner,
        jokerCard: this.jokerCard,
        andarCards: this.andarCards,
        baharCards: this.baharCards,
        timestamp: Date.now(),
      };

      await redis.lpush("game_history", JSON.stringify(result));
      await redis.ltrim("game_history", 0, 99); // Keeping last 100 games
    } catch (error) {
      console.error(`Failed to store game result for ${this.gameId}:`, error);
    }
  }

  async placeBet(userId, side, amount) {
    if (this.status !== GAME_STATES.BETTING) {
      throw new Error("Betting is closed");
    }

    try {
      await redis.hset(
        `bets:${this.gameId}`,
        userId,
        JSON.stringify({
          side,
          amount,
          timestamp: Date.now(),
        }),
      );

      // Track active bets for the user
      await redis.hincrby(`user:${userId}:active_bets`, this.gameId, amount);
    } catch (error) {
      console.error(`Failed to place bet for user ${userId}:`, error);
      throw new Error("Failed to place bet");
    }
  }
}

export default AndarBaharGame;
