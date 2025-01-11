import BaseGame from "../shared/config/base_game.js";
import redis from "../../config/redis.js";
import { GAME_STATES } from "../shared/config/types.js";
import gameManager from "../shared/config/manager.js";
import { compareHands } from "../shared/helper/compareHands.js";

class TeenPattiGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.player1Cards = null;
    this.player2Cards = null;
    this.blindCard = null;
    this.bettingResults = {
      player1: [],
      player2: [],
    };
    this.players = new Map();
    this.winner = null;
    this.BETTING_PHASE_DURATION = 30000; // 30 seconds for betting
    this.CARD_DEAL_DURATION = 5000; // 5 seconds for dealing
    this.gameInterval = null;
  }

  logSpecificGameState() {
    console.log("Danishan: TeenPattiGame.js");
    // console.log("Blind Card:", this.blindCard);
    // console.log("Player 1 Cards:", this.player1Cards);
    // console.log("Player 2 Cards:", this.player2Cards);
  }

  async saveState() {
    try {
      await super.saveState();
      await redis.hmset(`game:${this.gameId}:teenpatti`, {
        blindCard: this.blindCard ? JSON.stringify(this.blindCard) : "",
        player1Cards: this.player1Cards
          ? JSON.stringify(this.player1Cards)
          : "",
        player2Cards: this.player2Cards
          ? JSON.stringify(this.player2Cards)
          : "",
        bettingResults: JSON.stringify(this.bettingResults),
        winner: this.winner || "",
      });
    } catch (error) {
      console.error(
        `Failed to save Teen Patti state for ${this.gameId}:`,
        error
      );
    }
  }

  async recoverState() {
    try {
      await super.recoverState();
      const state = await redis.hgetall(`game:${this.gameId}:teenpatti`);
      if (state && Object.keys(state).length) {
        this.blindCard = state.blindCard ? JSON.parse(state.blindCard) : null;
        this.player1Cards = state.player1Cards
          ? JSON.parse(state.player1Cards)
          : null;
        this.player2Cards = state.player2Cards
          ? JSON.parse(state.player2Cards)
          : null;
        this.bettingResults = state.bettingResults
          ? JSON.parse(state.bettingResults)
          : {};
        this.winner = state.winner || null;
      }
    } catch (error) {
      console.error(
        `Failed to recover Teen Patti state for ${this.gameId}:`,
        error
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

    // Deal cards
    this.blindCard = this.deck.shift();
    this.player1Cards = [
      this.deck.shift(),
      this.deck.shift(),
      this.deck.shift(),
    ];
    this.player2Cards = [
      this.deck.shift(),
      this.deck.shift(),
      this.deck.shift(),
    ];

    await this.saveState();
    this.logGameState("Dealing Phase Started");

    setTimeout(async () => {
      await this.determineWinner();
    }, this.CARD_DEAL_DURATION);
  }

  async determineWinner() {
    const result = compareHands(this.player1Cards, this.player2Cards);
    this.status = GAME_STATES.COMPLETED;
    this.winner = result === 1 ? "player1" : "player2";
    await this.saveState();

    this.logGameState("Winner Determined");

    await this.distributeWinnings();
    await this.endGame();
  }

  async distributeWinnings() {
    const winningBets = this.bettingResults[this.winner];
    for (const bet of winningBets) {
      const player = this.players.get(bet.playerId);
      if (player) {
        player.balance += bet.amount * 1.95; // 1.95x payout for winning bets
      }
    }

    const losingPlayer = this.winner === "player1" ? "player2" : "player1";
    const losingBets = this.bettingResults[losingPlayer];
    for (const bet of losingBets) {
      const player = this.players.get(bet.playerId);
      if (player) {
        player.balance -= bet.amount;
      }
    }
  }

  async placeBet(playerId, betDetails) {
    if (this.status !== GAME_STATES.BETTING) {
      throw new Error("Betting is closed");
    }

    try {
      await redis.hset(
        `bets:${this.gameId}`,
        playerId,
        JSON.stringify({
          player: betDetails.player,
          amount: betDetails.amount,
          timestamp: Date.now(),
        })
      );

      await redis.hincrby(
        `user:${playerId}:active_bets`,
        this.gameId,
        betDetails.amount
      );

      if (betDetails.player && this.bettingResults[betDetails.player]) {
        this.bettingResults[betDetails.player].push({
          playerId,
          amount: betDetails.amount,
        });
      }
    } catch (error) {
      console.error(`Failed to place bet for player ${playerId}:`, error);
      throw new Error("Failed to place bet");
    }
  }

  async storeGameResult() {
    try {
      const result = {
        gameId: this.gameId,
        winner: this.winner,
        blindCard: this.blindCard,
        player1Cards: this.player1Cards,
        player2Cards: this.player2Cards,
        bettingResults: this.bettingResults,
        timestamp: Date.now(),
      };

      await redis.lpush("game_history", JSON.stringify(result));
      await redis.ltrim("game_history", 0, 99); // Keep last 100 games
    } catch (error) {
      console.error(`Failed to store game result for ${this.gameId}:`, error);
    }
  }

  async endGame() {
    this.status = GAME_STATES.COMPLETED;
    await this.saveState();
    await this.storeGameResult();

    this.logGameState("Game Completed");

    setTimeout(async () => {
      try {
        await this.clearState();
        const newGame = await gameManager.startNewGame(GAME_TYPES.TEEN_PATTI);
        gameManager.activeGames.delete(this.gameId);
        await newGame.start();
      } catch (error) {
        console.error("Failed to start new game:", error);
      }
    }, 5000);
  }
}

export default TeenPattiGame;
