import { GAME_STATES } from "./types.js";
import { getBetMultiplier, initializeDeck } from "../helper/deckHelper.js";
import { placeBet, processBetResults, validateBetAmount, } from "../helper/betHelper.js";
import { logger } from "../../../logger/logger.js";
import VideoProcessor from "../../VAT/index.js";
import { broadcastVideoComplete, broadcastVideoProgress, processGameStateVideo, } from "../helper/unixHelper.js";
import { broadcastGameState } from "./handler.js";
import { aggregateBets } from "../helper/resultHelper.js";
import gameManager from "./manager.js";

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
    this.status = GAME_STATES.BETTING;
    this.startTime = Date.now();
    this.broadcastGameState();

    this.gameInterval = setTimeout(async () => {
      await this.dealing();
    }, this.BETTING_PHASE_DURATION);
  }

  end() {
    this.status = GAME_STATES.COMPLETED;
    this.real_winner = this.winner;
    this.broadcastGameState();

    // this.logGameState("Game Completed");

    this.status = GAME_STATES.WAITING;
    setTimeout(async () => {
      try {
        const newGame = await gameManager.startNewGame(this.gameType);
        gameManager.activeGames.delete(this.gameId);
        await newGame.start();
      } catch (error) {
        console.error("Failed to start new game:", error);
      }
    }, 5000);

  }

  async dealing() {
    // comes after betting
    this.status = GAME_STATES.DEALING;

    try {
      // set joker card / blind card
      await this.firstServe();

      // set player and winner
      const bets = await aggregateBets(this.gameId); // TODO: rename `gameId` to roundId.
      this.determineOutcome(bets);

      // change state, broadcast for the last time, and reset the game.
      setTimeout(async () => {
        this.end();
      }, this.CARD_DEAL_DURATION);

    } catch (err) {
      logger.error(`Failed to start dealing for ${this.gameType}:`, err);
    }

  }

  logGameState(event) {
    return;
    folderLogger(`game_logs/${this.gameType}`, this.gameType).info(
      JSON.stringify(
        {
          gameType: this.gameType,
          status: this.status,
          winner: this.winner,
          blindCard: this.blindCard,
          winningCard: this.secondCard,
          playerA: this.players.A,
          playerB: this.players.B,
          playerC: this.players.C,
        },
        null,
        2
      )
    ); // Using a 2-space indentation for better formatting
    return;
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

  resetGame() { //TODO: verify this function
    this.jokerCard = null;
    this.players.A = [];
    this.players.B = [];
    this.players.C = [];
    this.winner = null;
    this.real_winner = null;
    this.status = null;
    this.deck = this.initializeDeck();

    //additional values
    this.bets = new Map(); // Add this to track bets
  }

  // Abstract methods to be implemented by each game
  determineOutcome(bets = {}) {
    throw new Error(`determineOutcome must be implemented ${bets}`);
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
