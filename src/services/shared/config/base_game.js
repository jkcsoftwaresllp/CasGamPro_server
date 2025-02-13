import { GAME_STATES, GAME_TYPES } from "./types.js";
import { initializeDeck } from "../helper/deckHelper.js";
import { logger } from "../../../logger/logger.js";
import SocketManager from "./socket-manager.js";
import VideoProcessor from "../../VAT/index.js";
import {
  broadcastVideoComplete,
  broadcastVideoProgress,
  processGameStateVideo,
} from "../helper/unixHelper.js";
import { aggregateBets } from "../helper/resultHelper.js";
import { createGameStateObserver } from "../helper/stateObserver.js";
import gameManager from "./manager.js";
import { logGameStateUpdate } from "../helper/logGameStateUpdate.js";

export default class BaseGame {
  constructor(roundId) {
    this.roundId = roundId; // TODO: Make this shorter
    this.status = GAME_STATES.WAITING;
    this.startTime = null;
    this.winner = null;
    this.deck = initializeDeck();
    this.jokerCard = null;
    this.blindCard = null;
    this.players = {
      A: [],
      B: [],
      C: [],
    };
    this.cards = [];
    this.gameType = null;
    this.gameInterval = null;
    this.BETTING_PHASE_DURATION = 30000; // default time if not provided 30s
    this.CARD_DEAL_INTERVAL = 3000;

    this.videoProcessor = new VideoProcessor();
    this.videoState = {
      processing: false,
      progress: 0,
      outputPath: null,
    };

    this.bets = new Map(); // Add this to track bets
    this.betSides = [];

    // Setup state observer
    return createGameStateObserver(this);
  }

  start() {
    this.status = GAME_STATES.BETTING;
    this.startTime = Date.now();

    this.gameInterval = setTimeout(async () => {
      await this.dealing();
    }, this.BETTING_PHASE_DURATION);
  }

  // Abstract methods to be implemented by each game
  async determineOutcome(bets = {}) {
    throw new Error(`\`determineOutcome\` must be implemented ${bets}`);
  }

  async dealing() {
    // comes after betting
    this.status = GAME_STATES.DEALING;

    try {
      // set joker card / blind card
      await this.firstServe();

      // set player and winner
      const bets = await aggregateBets(this.roundId);
      await this.determineOutcome(bets);

      // end game
      this.end();
    } catch (err) {
      logger.error(`Failed to start dealing for ${this.gameType}:`, err);
    }
  }

  end() {
    this.status = GAME_STATES.COMPLETED;
    this.real_winner = this.winner;

    setTimeout(async () => {
      try {
        const room = gameManager.gameRooms.get(this.roomId);
        if (room && room.users.size > 0) {
          const newGame = await gameManager.createNewGame(
            this.gameType,
            this.roomId
          );
          room.currentGame = newGame;
          gameManager.endGame(this.roundId);
          await newGame.start();
        } else {
          gameManager.endGame(this.roundId);
        }
      } catch (error) {
        logger.error("Failed to start new game:", error);
      }
    }, 5000);
  }

  getGameState() {
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
    this.deck = this.initializeDeck();

    this.bets = new Map();
  }

  broadcastGameState() {
    if (this.status === GAME_STATES.WAITING) return;

    SocketManager.broadcastGameState(this.gameType, this.getGameState());

    const io = global.io?.of("/game");
    if (!io) return;

    const gameState = this.getGameState();

    logGameStateUpdate(gameState);
    io.to(`game:${this.gameType}`).emit("gameStateUpdate", gameState);
  }
}

// UNIX SOCKETS
BaseGame.prototype.processGameStateVideo = processGameStateVideo;
BaseGame.prototype.broadcastVideoProgress = broadcastVideoProgress;
BaseGame.prototype.broadcastVideoComplete = broadcastVideoComplete;
