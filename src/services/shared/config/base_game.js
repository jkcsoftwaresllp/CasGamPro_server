import { GAME_STATES } from "./types.js";
import { getBetMultiplier, initializeDeck } from "../helper/deckHelper.js";
import { clearState, recoverState, saveState } from "../helper/stateHelper.js";
import {
  placeBet,
  processBetResults,
  validateBetAmount,
} from "../helper/betHelper.js";
import { logger } from "../../../logger/logger.js";
import VideoProcessor from '../../VAT';

export default class BaseGame {
  constructor(gameId) {
    this.gameId = gameId; // TODO: Make this shorter // TODO: Refactor this to roundId someday.
    this.status = GAME_STATES.WAITING;
    this.startTime = null;
    this.winner = null;
    this.deck = this.initializeDeck();
    this.jokerCard = null;
    this.blindCard = null;
    this.cards = [];
    this.gameInterval = null;
    this.BETTING_PHASE_DURATION = 30000; // default time if not provided 30s
    this.CARD_DEAL_INTERVAL = 500;

    this.videoProcessor = new VideoProcessor();

    this.bets = new Map(); // Add this to track bets
    this.betSides = [];
  }

  start() {
    throw new Error("Start method must be implemented");
  }
  end() {
    throw new Error("End method must be implemented");
  }
  collectCards() {
    throw new Error("Collect cards method must be implemented");
  }

  logSpecificGameState() {}

  logGameState(event) {
    return;
    logger.info(`\n=== ${this.gameId} - ${event} ===`);
    logger.info("Type:", this.constructor.name);
    logger.info("Status:", this.status);
    logger.info("Winner:", this.winner);
    this.logSpecificGameState(); // Implemented by child classes
    logger.info("Time:", new Date().toLocaleTimeString());
    logger.info("===============================\n");
  }
}

// DECK HELPER
BaseGame.prototype.initializeDeck = initializeDeck;
BaseGame.prototype.getBetMultiplier = getBetMultiplier;

// 	STATE HELPER	BaseGame.prototype.saveState = saveState;
BaseGame.prototype.saveState = saveState;
BaseGame.prototype.recoverState = recoverState;
BaseGame.prototype.clearState = clearState;

// 	BET HELPER
BaseGame.prototype.validateBetAmount = validateBetAmount;
BaseGame.prototype.processBetResults = processBetResults;
BaseGame.prototype.placeBet = placeBet;
