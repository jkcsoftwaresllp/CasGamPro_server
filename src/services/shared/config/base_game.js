import { GAME_STATES, GAME_TYPES, GAME_CONFIGS } from "./types.js";
import net from "net";
import { initializeDeck } from "../helper/deckHelper.js";
import { db } from "../../../config/db.js";
import { games, rounds } from "../../../database/schema.js";
import { logger } from "../../../logger/logger.js";
import StateMachine from "./state-machine.js";
import SocketManager from "./socket-manager.js";
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
    this.BETTING_PHASE_DURATION = 20000; 
    this.CARD_DEAL_INTERVAL = 1000;
    this.WINNER_DECLARATION_DELAY = 2000;
    this.WAITING_TIME = 2000; //5s waiting before bet for all games?

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
        `Invalid state transition from ${this.status} to ${newState}`,
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

    // Start streaming non-dealing phase
    try {
      await this.videoStreaming.startNonDealingStream(
        this.gameType,
        this.roundId,
      );
    } catch (err) {
      logger.error(`Failed to start non-dealing stream: ${err}`);
    }

    const timeout = setTimeout(async () => {
      await this.changeState(GAME_STATES.BETTING);
    }, this.WAITING_TIME);

    this.stateTimeouts.set(GAME_STATES.WAITING, timeout);
  }

  async handleBettingState() {
    this.preBetServe();

    const timeout = setTimeout(async () => {
      await this.calculateResult();
      console.info("Fixing:", this.players);
      console.info("Winning:", this.winner);
      const gameState = this.getGameState(true);
      await this.videoStreaming.startDealingPhase(gameState, this.roundId);
      await this.changeState(GAME_STATES.DEALING);
    }, this.BETTING_PHASE_DURATION);

    this.stateTimeouts.set(GAME_STATES.BETTING, timeout);
  }

  async handleDealingState() {
    try {
      this.broadcastGameState();

      // Reveal cards by listening to the video processor events
      await this.revealCards();

      // Don't need to poll for completion anymore - we get an event
      this.display.winner = this.winner;
      console.log("winner changed:", this.display.winner);
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

      // Stop streaming
      try {
        await this.videoStreaming.stop(this.gameType, this.roundId);
      } catch (err) {
        logger.error(`Failed to stop stream: ${err}`);
      }

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

    // Stop any active streams on error
    try {
      if (this.videoStreaming.isStreamActive()) {
        await this.videoStreaming.stop(this.gameType, this.roundId);
      }
    } catch (err) {
      logger.error(`Failed to stop stream on error: ${err}`);
    }

    await gameManager.restartGame(this.gameType);
  }

  // Helper methods
  async revealCards() {
    try {
      // Create a promise that will resolve when dealing is complete
      const dealingCompletePromise = this.videoStreaming.waitForDealingComplete();

      // Set up card reveal handlers for all expected cards
      // This makes the UI update immediately when cards are received, without waiting for other cards

      // Handle joker card
      if (this.jokerCard) {
        this.videoStreaming.on('cardPlaced', (card) => {
          if (card === this.jokerCard && !this.display.jokerCard) {
            logger.info(`Revealed joker card: ${card}`);
            this.display.jokerCard = card;
            this.broadcastGameState();
          }
        });
      }

      // Handle blind card
      if (this.blindCard) {
        this.videoStreaming.on('cardPlaced', (card) => {
          if (card === this.blindCard && !this.display.blindCard) {
            logger.info(`Revealed blind card: ${card}`);
            this.display.blindCard = card;
            this.broadcastGameState();
          }
        });
      }

      // Handle player cards
      for (const side of ["A", "B", "C"]) {
        for (let i = 0; i < this.players[side].length; i++) {
          const card = this.players[side][i];
          if (card) {
            const sideIndex = i; // Capture current index in closure
            this.videoStreaming.on('cardPlaced', (receivedCard) => {
              // Check if this is our card and it hasn't been displayed yet
              if (receivedCard === card && !this.display.players[side][sideIndex]) {
                logger.info(`Revealed player card ${side}[${sideIndex}]: ${receivedCard}`);
                this.display.players[side][sideIndex] = receivedCard;
                this.broadcastGameState();
              }
            });
          }
        }
      }

      // Wait for dealing completion signal from video processor
      logger.info(`Waiting for dealing phase completion signal...`);
      await dealingCompletePromise;
      logger.info(`Dealing phase completed`);

      // Clean up all listeners to prevent memory leaks
      this.videoStreaming.removeAllListeners('cardPlaced');

      return true;
    } catch (error) {
      // Clean up listeners on error too
      this.videoStreaming.removeAllListeners('cardPlaced');
      logger.error(`Error in card reveal process: ${error.message}`);
      throw error;
    }
  }

  async dealCardsSequentially() {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const totalCards = Math.max(
      this.players.A.length,
      this.players.B.length,
      this.players.C.length,
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
        winner: Array.isArray(this.winner) ? this.winner[0] : this.winner,
        // winner: 'dragon', // For when playing dragon tiger only
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
