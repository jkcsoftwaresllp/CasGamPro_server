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
    this.BETTING_PHASE_DURATION = 10000; // shouldn't betting phase be of same duration for everyone?
    this.CARD_DEAL_INTERVAL = 1000;
    this.WINNER_DECLARATION_DELAY = 2000;
    this.WAITING_TIME = 1000; //5s waiting before bet for all games.

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
      const gameState = this.getGameState(true);
      await this.videoStreaming.startDealingPhase(gameState, this.roundId);
      await this.changeState(GAME_STATES.DEALING);
    }, this.BETTING_PHASE_DURATION);

    this.stateTimeouts.set(GAME_STATES.BETTING, timeout);
  }

  async handleDealingState() {
    try {
      this.broadcastGameState();

      // Reveal cards
      await this.revealCards();

      await this.videoStreaming.waitForCompletion(
          this.gameType,
          this.roundId,
          500,  // 120 attempts
          500   // 500ms interval
      );

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
      // await this.storeRoundHistory();

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
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Create a function to handle video processor responses
    const handleVideoResponse = () => {
      return new Promise((resolve, reject) => {
        const client = net.createConnection(this.videoStreaming.socketPath, () => {
          logger.info("Connected to video processor socket");

          try {
            const request = {
              phase: "get_next_card",
              game: this.gameType,
              host: this.videoStreaming.host,
              roundId: this.roundId,
              game_state: null,
            };

            const requestString = JSON.stringify(request) + "\n";
            client.write(requestString);
          } catch (error) {
            client.end();
            reject(error);
          }
        });

        let dataBuffer = "";

        client.on("data", (data) => {
          dataBuffer += data.toString();
          logger.debug(`Received data: ${dataBuffer}`);

          // Look for complete messages separated by newlines
          const messages = dataBuffer.split("\n");

          // Keep the last incomplete message in the buffer
          dataBuffer = messages.pop();

          for (const msg of messages) {
            if (!msg.trim()) continue;

            try {
              const response = JSON.parse(msg);
              logger.info("Parsed response:", response);

              if (response.status === "card_placed" || response.card) {
                client.end();
                resolve(response);
                return;
              }
            } catch (e) {
              logger.error("Failed to parse message:", msg, e);
            }
          }
        });

        client.on("error", (error) => {
          logger.error("Socket error:", error);
          reject(error);
        });

        client.on("end", () => {
          logger.info("Connection ended");
          if (dataBuffer.trim()) {
            try {
              const response = JSON.parse(dataBuffer);
              resolve(response);
            } catch (e) {
              reject(new Error("Connection ended with incomplete data"));
            }
          }
        });

        // Set timeout for connection
        client.setTimeout(5000, () => {
          logger.error("Connection timeout");
          client.end();
          reject(new Error("Connection timeout waiting for card reveal"));
        });
      });
    };

    try {
      // Wait for and reveal joker and blind cards
      const jokerResponse = await handleVideoResponse();
      if (jokerResponse.card === this.jokerCard) {
        this.display.jokerCard = this.jokerCard;
        this.broadcastGameState();
      }

      const blindResponse = await handleVideoResponse();
      if (blindResponse.card === this.blindCard) {
        this.display.blindCard = this.blindCard;
        this.broadcastGameState();
      }

      // Deal player cards sequentially
      const totalCards = Math.max(
        this.players.A.length,
        this.players.B.length,
        this.players.C.length
      );

      for (let i = 0; i < totalCards; i++) {
        for (const side of ["A", "B", "C"]) {
          if (this.players[side][i]) {
            const cardResponse = await handleVideoResponse();
            if (cardResponse.card === this.players[side][i]) {
              this.display.players[side][i] = this.players[side][i];
              this.broadcastGameState();
            }
          }
        }
      }

      // Wait for final confirmation before proceeding
      const finalResponse = await handleVideoResponse();
      if (finalResponse.status === "ready_for_winner") {
        // Now we can proceed to show the winner
        await delay(this.WINNER_DECLARATION_DELAY);
        // Winner will be set in handleDealingState after video completion
      }

    } catch (error) {
      logger.error("Error during card reveal synchronization:", error);
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
        // winner: Array.isArray(this.winner) ? this.winner[0] : this.winner,
        winner: 'dragon', // For when playing dragon tiger only
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
