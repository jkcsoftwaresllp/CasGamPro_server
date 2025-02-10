import { GAME_STATES } from "./types.js";
import { getBetMultiplier, initializeDeck } from "../helper/deckHelper.js";
import { placeBet, processBetResults, validateBetAmount, } from "../helper/betHelper.js";
import { logger } from "../../../logger/logger.js";
import VideoProcessor from "../../VAT/index.js";
import { broadcastVideoComplete, broadcastVideoProgress, processGameStateVideo, } from "../helper/unixHelper.js";
import { broadcastGameState } from "./handler.js";
import { calculateResult } from "../helper/resultHelper.js";

export default class BaseGame {
  constructor(gameId) {
    this.gameId = gameId; // TODO: Make this shorter // TODO: Refactor this to roundId someday.
    this.status = GAME_STATES.WAITING;
    this.startTime = null;
    this.winner = null;
    this.deck = this.initializeDeck();
    this.jokerCard = null;
    this.blindCard = null;
    this.players = {
      A: [],
      B: [],
      C: [],
    }
    this.cards = [];
    this.gameType = null; // why was this initialized with an array here?
    this.gameInterval = null;
    this.BETTING_PHASE_DURATION = 30000; // default time if not provided 30s
    this.CARD_DEAL_INTERVAL = 500;

    this.videoProcessor = new VideoProcessor();
    this.videoState = {
      processing: false,
      progress: 0,
      outputPath: null,
    };

    this.bets = new Map(); // Add this to track bets
    this.betSides = [];
  }

  start() {
    throw new Error("Start method must be implemented");
  }
  end() {
    throw new Error("End method must be implemented");
  }

  getGameState() {
    return {
      gameType: this.gameType,
      gameId: this.gameId,
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
    }
  }

  // Abstract methods to be implemented by each game
  determineOutcome(bets) {
    throw new Error("determineOutcome must be implemented");
  }

}

// DECK HELPER
BaseGame.prototype.initializeDeck = initializeDeck;
BaseGame.prototype.getBetMultiplier = getBetMultiplier;

// 	BET HELPER
BaseGame.prototype.validateBetAmount = validateBetAmount;
BaseGame.prototype.processBetResults = processBetResults;
BaseGame.prototype.placeBet = placeBet;
// BaseGame.prototype.broadcastBets = broadcastBets;

// UNIX SOCKETS
BaseGame.prototype.processGameStateVideo = processGameStateVideo;
BaseGame.prototype.broadcastVideoProgress = broadcastVideoProgress;
BaseGame.prototype.broadcastVideoComplete = broadcastVideoComplete;

// GAME SOCKETS
BaseGame.prototype.broadcastGameState = broadcastGameState;

// RESULT HELPER
BaseGame.prototype.calculateResult = calculateResult;
