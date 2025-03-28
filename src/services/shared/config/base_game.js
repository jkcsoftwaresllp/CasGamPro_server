import { GAME_STATES, GAME_TYPES, GAME_CONFIGS, VIDEO_ENABLED_GAMES, initializeGameProperties } from "./types.js";
import net from "net";
import { initializeDeck } from "../helper/deckHelper.js";
import { db } from "../../../config/db.js";
import { game_rounds, games } from "../../../database/schema.js";
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
    this.BETTING_PHASE_DURATION = 19000;
    this.WINNER_DECLARATION_DELAY = 5000;
    this.WAITING_TIME = 0;

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

    this.currentTimer = null;

    // Define timer configurations
    this.timerConfigs = {
      betting: {
        label: 'betting',
        duration: 20000
      },
      dealing: {
        label: 'dealing',
        duration: 3000,
      },
      completed: {
        label: 'completed',
        duration: 5000
      }
    };

    // Setup state observer
    return createGameStateObserver(this);
  }

  startTimer(label) {
    let config = this.timerConfigs[label];

    if (label === 'dealing' && this.gameType === GAME_TYPES.TEEN_PATTI) {
      config = {
        label: 'dealing',
        duration: 5000,
      }
    }
    if (!config) {
      console.error("Timer not found: recheck `label`");
      return
    };

    this.currentTimer = {
      label,
      currentTime: 0,
      duration: config.duration,
      timestamp: Date.now()
    };

    SocketManager.broadcastTimer(this.gameType, this.currentTimer);
  }

  async initialize(gameType) {
    try {
      const props = await initializeGameProperties(gameType);
      Object.assign(this, props);
    } catch (error) {
      console.error("Failed to initialize game properties:", error);
    }
  }

  preBetServe() { }
  firstServe() { }

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
    this.registerRoundInDB();

    const timeout = setTimeout(async () => {
      await this.changeState(GAME_STATES.BETTING);
    }, this.WAITING_TIME);

    this.stateTimeouts.set(GAME_STATES.WAITING, timeout);
  }

  async handleBettingState() {
    this.startTimer('betting');

    const isVideoEnabled = VIDEO_ENABLED_GAMES.includes(this.gameType);
    // console.info(this.gameType, isVideoEnabled);
    if (isVideoEnabled) {
      // Start streaming non-dealing phase
      try {
        await this.videoStreaming.startNonDealingStream(
          this.gameType,
          this.roundId,
        );
      } catch (err) {
        logger.error(`Failed to start non-dealing stream: ${err}`);
      }
    } else {
      console.info("Skipping nd videos...");
    }
    this.preBetServe();

    const timeout = setTimeout(async () => {
      await this.calculateResult();
      console.info("Fixing:", this.players);
      console.info("Winning:", this.winner);
      const gameState = this.getGameState(true);

      if (isVideoEnabled) {
        await this.videoStreaming.startDealingPhase(gameState, this.roundId);
      } else {
        console.info("Skipper d videos..");
      }

      await this.changeState(GAME_STATES.DEALING);
    }, this.BETTING_PHASE_DURATION);

    this.stateTimeouts.set(GAME_STATES.BETTING, timeout);
  }

  async handleDealingState() {
    this.startTimer('dealing');

    try {
      // Broadcast current state
      this.broadcastGameState();

      // Check if game supports video streaming
      let isVideoEnabled = VIDEO_ENABLED_GAMES.includes(this.gameType);
      console.info(this.gameType, isVideoEnabled);

      // if (this.gameType === GAME_TYPES.TEEN_PATTI || this.gameType === GAME_TYPES.DRAGON_TIGER_TWO) {
      if (this.gameType === GAME_TYPES.TEEN_PATTI) {
        isVideoEnabled = false;
      }

      if (isVideoEnabled) {
        // Try using video streaming reveal method
        let properDealing = false;
        try {
          properDealing = await this.revealCards();
        } catch (videoErr) {
          logger.error("Error in video streaming reveal: " + videoErr.message);
        }

        // Fallback to legacy method if video streaming fails
        if (!properDealing) {
          logger.warn("Falling back to legacy reveal cards method");
          await this.legacyRevealCards();
        }
      } else {
        // Directly use legacy method for non-video games
        logger.info(`Using legacy reveal for non-video game: ${this.gameType}`);
        await this.legacyRevealCards();
      }

      // Update winner display and change state
      this.display.winner = this.winner;
      await this.changeState(GAME_STATES.COMPLETED);

      // Reset display for next round
      this.resetDisplay();
    } catch (err) {
      logger.error(`Failed dealing state: ${err}`);
      await this.handleError(err);
    }
  }

  async handleCompletedState() {
    this.startTimer('completed');

    try {
      await this.distributeWinnings();
      await this.updateRoundInDB();

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
      // Create a promise that resolves when dealing is complete.
      const dealingCompletePromise = this.videoStreaming.waitForDealingComplete();

      // Setup card reveal handlers for joker, blind card, and each player's cards.
      if (this.jokerCard) {
        this.videoStreaming.on("cardPlaced", (card) => {
          if (card === this.jokerCard && !this.display.jokerCard) {
            logger.info(`Revealed joker card: ${card}`);
            this.display.jokerCard = card;
            // this.startTimer("dealing"); //updating timer on card reveal
            this.broadcastGameState();
          }
        });
      }
      if (this.blindCard) {
        this.videoStreaming.on("cardPlaced", (card) => {
          if (card === this.blindCard && !this.display.blindCard) {
            logger.info(`Revealed blind card: ${card}`);
            this.display.blindCard = card;
            this.startTimer("dealing"); //updating timer on card reveal
            this.broadcastGameState();
          }
        });
      }
      for (const side of ["A", "B", "C"]) {
        for (let i = 0; i < this.players[side].length; i++) {
          const card = this.players[side][i];
          if (card) {
            const sideIndex = i;
            this.videoStreaming.on("cardPlaced", (receivedCard) => {
              if (receivedCard === card && !this.display.players[side][sideIndex]) {
                logger.info(`Revealed player card ${side}[${sideIndex}]: ${receivedCard}`);
                this.display.players[side][sideIndex] = receivedCard;
                this.startTimer("dealing"); //updating timer on card reveal
                this.broadcastGameState();
              }
            });
          }
        }
      }

      // Wait for the dealing-phase completion signal from the video processor.
      logger.info("Waiting for dealing phase completion signal...");
      const completionMsg = await dealingCompletePromise;

      // If we received an indication that things did not complete correctly…
      if (completionMsg === "CONNECTION_CLOSED") {
        logger.warn("Falling back to legacy reveal cards method due to connection closed before complete event");
        this.videoStreaming.removeAllListeners("cardPlaced");
        return false;
      }

      logger.info("Dealing phase completed via video streaming");

      // Clean up listeners to avoid memory leaks.
      this.videoStreaming.removeAllListeners("cardPlaced");

      return true;
    } catch (error) {
      this.videoStreaming.removeAllListeners("cardPlaced");
      logger.error(`Error in card reveal process (video streaming): ${error.message}`);
      throw error;
    }
  }

  // Legacy version that reveals all cards sequentially (with delays) before showing the winner.
  async legacyRevealCards() {
    console.log("Starting legacy card dealing...");
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Optionally reveal a blind card after a short delay
    await delay(1000);
    this.display.blindCard = this.blindCard;
    this.startTimer("dealing"); //updating timer on card reveal
    this.broadcastGameState();

    // Deal player cards sequentially so the user sees each card
    await this.legacyDealCardsSequentially();

    // Wait two seconds after the last card is displayed, then reveal the winner.
    await delay(1000);
    this.display.winner = this.winner;
    this.startTimer("dealing"); //updating timer on card reveal
    this.broadcastGameState();
  }

  async legacyDealCardsSequentially() {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const totalCards = Math.max(
      this.players.A.length,
      this.players.B.length,
      this.players.C.length
    );

    for (let i = 0; i < totalCards; i++) {
      for (const side of ["A", "B", "C"]) {
        if (this.players[side][i]) {
          await delay(this.gameType === GAME_TYPES.TEEN_PATTI ? 5000 : 3000);
          this.display.players[side][i] = this.players[side][i];
          logger.info(`Legacy reveal: ${side}[${i}]: ${this.players[side][i]}`);
          this.startTimer("dealing"); //updating timer on card reveal
          this.broadcastGameState();
        }
      }
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
          await delay(1000);
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

  async registerRoundInDB() {
    // Store round history in database
    try {
      const gameData = await db
        .select({ gameId: games.id })
        .from(games)
        .where(eq(games.gameType, this.gameType));

      const roundData = {
        id: this.roundId,
        game_id: gameData[0].gameId,
      };

      // Insert round data
      await db.insert(game_rounds).values(roundData);
    } catch (error) {
      logger.error("Failed to store round history:", error);
    }
  }

  async updateRoundInDB() {
    // Store round history in database
    try {
      const roundData = {
        playerA: JSON.stringify(this.players.A),
        playerB: JSON.stringify(this.players.B),
        playerC: JSON.stringify(this.players.C),
        joker_card: this.jokerCard || "",
        blind_card: this.blindCard || "",
        winner: JSON.stringify(this.winner),
      };

      // Update round data
      await db
        .update(game_rounds)
        .set(roundData)
        .where(eq(game_rounds.id, this.roundId)); // ensure correct property name
    } catch (error) {
      logger.error("Failed to store round history:", error);
    }
  }
}

BaseGame.prototype.distributeWinnings = distributeWinnings;
