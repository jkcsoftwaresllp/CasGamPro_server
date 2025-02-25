import { GAME_STATES, GAME_TYPES, GAME_CONFIGS } from "./types.js";
import { initializeDeck } from "../helper/deckHelper.js";
import { db } from "../../../config/db.js";
import { rounds } from "../../../database/schema.js";
import { logger } from "../../../logger/logger.js";
import SocketManager from "./socket-manager.js";
import VideoProcessor from "../../VAT/index.js";
import {
  broadcastVideoComplete,
  broadcastVideoProgress,
  processGameStateVideo,
} from "../helper/unixHelper.js";
import { aggregateBets, distributeWinnings } from "../helper/resultHelper.js";
import { createGameStateObserver } from "../helper/stateObserver.js";
import gameManager from "./manager.js";
import { VideoStreamingService } from "./video-streamer.js";

export default class BaseGame {
  constructor(roundId) {
    //Common properties for all games
    this.roundId = roundId; // TODO: Make this shorter
    this.status = GAME_STATES.WAITING;
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

    this.videoProcessor = new VideoProcessor();
    this.videoState = {
      processing: false,
      progress: 0,
      outputPath: null,
    };

    // this.videoStreaming = new VideoStreamingService();

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

  preBetServe() { }
  firstServe() { }

  async start() {
    await this.betting();
    this.status = GAME_STATES.WAITING;
    this.startTime = Date.now();

    // // Start video streaming
    // await this.videoStreaming.startNonDealingStream(
    //   this.gameType,
    //   this.roundId,
    // );

    this.gameInterval = setTimeout(async () => {
      await this.betting();
    }, this.WAITING_TIME);
  }

  async betting() {
    this.preBetServe();
    this.status = GAME_STATES.BETTING;

    this.gameInterval = setTimeout(async () => {
      await this.calculateResult();
      await this.dealing();
    }, this.BETTING_PHASE_DURATION);
  }

  async calculateResult() {
    // set joker card / blind card
    this.firstServe();

    // set player and winner
    const temp = await aggregateBets(this.roundId);
    this.determineOutcome(temp);
  }

  async dealing() {
    this.status = GAME_STATES.DEALING;

    // // Start dealing phase video with pre-calculated results
    // await this.videoStreaming.startDealingPhase(this.getGameState(true), this.roundId);
    // setTimeout(async () => {
    //   await this.end();
    // }, 30000);

    try {
      // Reset display state
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

      // Create a promise-based delay function
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      // Reveal joker and blind cards
      await delay(1000);
      this.display.jokerCard = this.jokerCard;
      this.display.blindCard = this.blindCard;
      this.broadcastGameState();

      // Calculate total cards
      const totalCards = Math.max(
        this.players.A.length,
        this.players.B.length,
        this.players.C.length,
      );

      // Deal cards sequentially
      for (let i = 0; i < totalCards; i++) {
        for (const side of ["A", "B", "C"]) {
          if (this.players[side][i]) {
            await delay(this.CARD_DEAL_INTERVAL);
            this.display.players[side][i] = this.players[side][i];
            this.broadcastGameState();
          }
        }
      }

      // Reveal winner
      await delay(this.CARD_DEAL_INTERVAL);
      this.display.winner = this.winner;
      this.broadcastGameState();

      // End game
      await delay(this.WINNER_DECLARATION_DELAY);
      await this.end();
    } catch (err) {
      logger.error(`Failed to start dealing for ${this.gameType}:`, err);
    }
  }

  async end() {
    this.status = GAME_STATES.COMPLETED;

    // Stop video streaming
    // this.videoStreaming.stop();

    // Store round history in database
    try {
      const gameConfig = GAME_CONFIGS[this.gameType];
      if (!gameConfig) {
        throw new Error(`Game config not found for type: ${this.gameType}`);
      }

      const roundData = {
        roundId: this.roundId,
        gameId: gameConfig.id,
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

    // Distribute winnings
    await this.distributeWinnings();

    // Start new game instance
    setTimeout(() => {
      try {
        gameManager.endGame(this.gameType);
      } catch (error) {
        logger.error("Failed to end game:", error);
      }
    }, 5000);
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
      infor: `${gameState.roundId}: ${gameState.gameType} | ${gameState.status || "-"
        } | ${gameState.winner || "-"}`,
      cards: `J : ${gameState.cards.jokerCard || "-"} | B: ${gameState.cards.blindCard || "-"
        } `,
      playerA: gameState.cards.playerA.join(", ") || "-",
      playerB: gameState.cards.playerB.join(", ") || "-",
      playerC: gameState.cards.playerC.join(", ") || "-",
    };

    if (Object.values(GAME_TYPES).includes(gameState.gameType)) {
      folderLogger(logPath, gameState.gameType).info(
        JSON.stringify(printible, null, 2),
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
    this.deck = this.initializeDeck();

    this.bets = new Map();
  }

  broadcastGameState() {
    if (this.status === GAME_STATES.WAITING) return;

    SocketManager.broadcastGameState(this.gameType, this.getGameState());
  }

  // Abstract methods to be implemented by each game
  determineOutcome(bets = {}) {
    throw new Error(`\`determineOutcome\` must be implemented ${bets}`);
  }
}

BaseGame.prototype.distributeWinnings = distributeWinnings;

// UNIX SOCKETS
BaseGame.prototype.processGameStateVideo = processGameStateVideo;
BaseGame.prototype.broadcastVideoProgress = broadcastVideoProgress;
BaseGame.prototype.broadcastVideoComplete = broadcastVideoComplete;
