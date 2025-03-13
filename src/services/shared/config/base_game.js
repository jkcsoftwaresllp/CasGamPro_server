import {
  GAME_STATES,
  GAME_TYPES,
  GAME_CONFIGS,
  getGameConfig,
} from "./types.js";
import { initializeDeck } from "../helper/deckHelper.js";
import { db } from "../../../config/db.js";
import { games, rounds } from "../../../database/schema.js";
import { logger } from "../../../logger/logger.js";
import StateMachine from "./state-machine.js";
import SocketManager from "./socket-manager.js";
import {
  broadcastVideoComplete,
  broadcastVideoProgress,
  processGameStateVideo,
} from "../helper/unixHelper.js";
import { aggregateBets, distributeWinnings } from "../helper/resultHelper.js";
import { createGameStateObserver } from "../helper/stateObserver.js";
import gameManager from "./manager.js";
import { VideoStreamingService } from "./video-streamer.js";
import { eq } from "drizzle-orm";

export default class BaseGame extends StateMachine {
  constructor() {
    //Common properties for all games
    super();
    this.status = null;
    this.startTime = null;
    this.deck = initializeDeck();
    this.jokerCard = null;
    this.blindCard = null;
    this.players = {
      A: [],
      B: [],
      C: [],
    };
    this.winner = null;
    this.gameInterval = null;
    this.BETTING_PHASE_DURATION = 30000; // shouldn't betting phase be of same duration for everyone?
    this.CARD_DEAL_INTERVAL = 3000;
    this.WINNER_DECLARATION_DELAY = 2000;
    this.WAITING_TIME = 5000; //5s waiting before bet for all games.

    this.videoStreaming = new VideoStreamingService();

    this.betSides = [];
    this.winningBets = new Map();
    this.bets = new Map();
    this.playerBalances = new Map(); // Format: { userId: currentBalance }

    // Initialize display object first
    this.display = {
      jokerCard: null,
      blindCard: null,
      players: {
        A: [],
        B: [],
        C: [],
      },
      winner: null,
    };

    // Setup state observer
    return createGameStateObserver(this);
  }

  preBetServe() {}
  firstServe() {}

  async changeState(newState) {
    if (!this.isValidTransition(this.status, newState)) {
      throw new Error(
        `Invalid state transition from ${this.status} to ${newState}`
      );
    }

    // Clear any existing timeouts
    this.clearStateTimeout();

    // Update states
    this.previousState = this.status;
    this.currentState = newState;
    this.status = newState;

    // Execute state-specific logic
    await this.executeStateLogic(newState);
  }

  async executeStateLogic(state) {
    switch (state) {
      case GAME_STATES.WAITING:
        await this.handleWaitingState();
        break;
      case GAME_STATES.BETTING:
        await this.handleBettingState();
        break;
      case GAME_STATES.DEALING:
        await this.handleDealingState();
        break;
      case GAME_STATES.COMPLETED:
        await this.handleCompletedState();
        break;
    }
  }

  async handleWaitingState() {
    this.startTime = Date.now();

    const timeout = setTimeout(async () => {
      await this.changeState(GAME_STATES.BETTING);
    }, this.WAITING_TIME);

    this.stateTimeouts.set(GAME_STATES.WAITING, timeout);
  }

  async handleBettingState() {
    this.preBetServe();

    const timeout = setTimeout(async () => {
      await this.calculateResult();
      await this.changeState(GAME_STATES.DEALING);
    }, this.BETTING_PHASE_DURATION);

    this.stateTimeouts.set(GAME_STATES.BETTING, timeout);
  }

  async handleDealingState() {
    try {
      // Reveal cards
      await this.revealCards();

      // Move to completed state
      await this.changeState(GAME_STATES.COMPLETED);

      // Reset display state
      this.resetDisplay();
    } catch (err) {
      logger.error(`Failed dealing state: ${err}`);
      await this.handleError(err);
    }
  }

  async handleCompletedState() {
    try {
      await this.distributeWinnings();
      await this.storeRoundHistory();

      const timeout = setTimeout(async () => {
        await gameManager.endGame(this.gameType);
      }, 5000);

      this.stateTimeouts.set(GAME_STATES.COMPLETED, timeout);
    } catch (err) {
      await this.handleError(err);
    }
  }

  async handleError(error) {
    logger.error(`Game error: ${error}`);
    this.clearStateTimeout();
    await gameManager.restartGame(this.gameType);
  }

  // Helper methods
  async revealCards() {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Reveal joker and blind cards
    await delay(1000);
    this.display.blindCard = this.blindCard;
    this.broadcastGameState();

    // Deal cards sequentially
    await this.dealCardsSequentially();

    // Reveal winner
    await delay(this.CARD_DEAL_INTERVAL);
    this.display.winner = this.winner;
    this.broadcastGameState();
  }

  async dealCardsSequentially() {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const totalCards = Math.max(
      this.players.A.length,
      this.players.B.length,
      this.players.C.length
    );

    for (let i = 0; i < totalCards; i++) {
      for (const side of ["A", "B", "C"]) {
        if (this.players[side][i]) {
          await delay(this.CARD_DEAL_INTERVAL);
          this.display.players[side][i] = this.players[side][i];
          this.broadcastGameState();
        }
      }
    }
  }

  resetDisplay() {
    this.display = {
      jokerCard: null,
      blindCard: null,
      players: { A: [], B: [], C: [] },
      winner: null,
    };
  }

  getGameState(preComputed = false) {
    if (preComputed) {
      return {
        gameType: this.gameType,
        roundId: this.roundId,
        status: this.status,
        cards: {
          jokerCard: this.jokerCard || null,
          blindCard: this.blindCard || null,
          playerA: this.players.A || [],
          playerB: this.players.B || [],
          playerC: this.players.C || [],
        },
        winner: this.winner,
        startTime: this.startTime,
      };
    } else {
      return {
        gameType: this.gameType,
        roundId: this.roundId,
        status: this.status,
        cards: {
          jokerCard: this.display.jokerCard || null,
          blindCard: this.display.blindCard || null,
          playerA: this.display.players.A || [],
          playerB: this.display.players.B || [],
          playerC: this.display.players.C || [],
        },
        winner: this.display.winner,
        startTime: this.startTime,
      };
    }
  }

  logGameState() {
    return;
    const gameState = this.getGameState();
    const logPath = `gameLogs/${gameState.gameType}`;

    const printible = {
      infor: `${gameState.roundId}: ${gameState.gameType} | ${
        gameState.status || "-"
      } | ${gameState.winner || "-"}`,
      cards: `J : ${gameState.cards.jokerCard || "-"} | B: ${
        gameState.cards.blindCard || "-"
      } `,
      playerA: gameState.cards.playerA.join(", ") || "-",
      playerB: gameState.cards.playerB.join(", ") || "-",
      playerC: gameState.cards.playerC.join(", ") || "-",
    };

    if (Object.values(GAME_TYPES).includes(gameState.gameType)) {
      folderLogger(logPath, gameState.gameType).info(
        JSON.stringify(printible, null, 2)
      );
    }
  }

  resetGame() {
    //TODO: verify this function
    this.jokerCard = null;
    this.players.A = [];
    this.players.B = [];
    this.players.C = [];
    this.winner = null;
    this.real_winner = null;
    this.status = null;
    this.deck = initializeDeck();

    this.bets = new Map();
  }

  broadcastGameState() {
    SocketManager.broadcastGameState(this.gameType, this.getGameState());
  }

  // Abstract methods to be implemented by each game
  determineOutcome(bets = {}) {
    throw new Error(`\`determineOutcome\` must be implemented ${bets}`);
  }

  async calculateResult() {
    // set joker card / blind card
    this.firstServe();

    // set player and winner
    const temp = await aggregateBets(this.roundId);
    this.determineOutcome(temp);
  }

  async storeRoundHistory() {
    // Store round history in database
    try {
      const gameConfig = await getGameConfig(this.gameType);
      if (!gameConfig) {
        throw new Error(`Game config not found for type: ${this.gameType}`);
      }

      const [{ gameId: gameIdInt }] = await db
        .select({ gameId: games.id })
        .from(games)
        .where(eq(games.gameId, gameConfig.gameId));

      const roundData = {
        roundId: this.roundId,
        gameId: gameIdInt,
        playerA: JSON.stringify(this.players.A),
        playerB: JSON.stringify(this.players.B),
        playerC: JSON.stringify(this.players.C),
        jokerCard: this.jokerCard || "",
        blindCard: this.blindCard || "",
        winner: JSON.stringify(this.winner),
      };

      // Insert round data
      await db.insert(rounds).values(roundData);
    } catch (error) {
      logger.error("Failed to store round history:", error);
    }
  }
}

BaseGame.prototype.distributeWinnings = distributeWinnings;

// UNIX SOCKETS
BaseGame.prototype.processGameStateVideo = processGameStateVideo;
BaseGame.prototype.broadcastVideoProgress = broadcastVideoProgress;
BaseGame.prototype.broadcastVideoComplete = broadcastVideoComplete;
