import { EventEmitter } from 'events';
import net from "net";
import { logger } from "../../../logger/logger.js";
import SocketManager from "./socket-manager.js";

export class VideoStreamingService extends EventEmitter {
  constructor() {
    super(); // Initialize EventEmitter
    this.socketPath = "/tmp/video-processor.sock";
    this.host = "HostA";
    this.currentStream = null;
    this.isStreaming = false;
    this.expectedCards = new Map(); // Map of expected cards for the game
  }

  extractCardCode(cardPath) {
    // Extract just the card code from paths like "assets/cards/spades_3.jpg"
    const match = cardPath.match(/(\w+)_(\w+)\.jpg$/);
    if (match) {
      const suit = match[1].charAt(0).toUpperCase();
      const value = match[2].toUpperCase();
      return suit + value;
    }
    return cardPath; // Return original if no match
  }

  async startNonDealingStream(gameType, roundId) {
    try {
      if (this.isStreaming) {
        logger.info(`Stopping existing stream before starting new one`);
        await this.stop(gameType, roundId);
      }

      const request = {
        phase: "non_dealing",
        game: gameType,
        host: this.host,
        roundId,
        game_state: null,
      };

      this.isStreaming = true;
      await this.sendRequest(request);
      logger.info(
        `Started non-dealing stream for ${gameType} round ${roundId}`,
      );
    } catch (error) {
      logger.error(`Failed to start non-dealing stream:`, error);
      this.isStreaming = false;
      throw error;
    }
  }

  async startDealingPhase(gameState, roundId) {
    try {
      if (!gameState) {
        throw new Error("Game state is required for dealing phase");
      }

      // Store expected cards for validation
      this.expectedCards.clear();
      if (gameState.cards.jokerCard) {
        this.expectedCards.set(gameState.cards.jokerCard, 'jokerCard');
      }
      if (gameState.cards.blindCard) {
        this.expectedCards.set(gameState.cards.blindCard, 'blindCard');
      }

      for (const card of gameState.cards.playerA || []) {
        this.expectedCards.set(card, 'playerA');
      }
      for (const card of gameState.cards.playerB || []) {
        this.expectedCards.set(card, 'playerB');
      }
      if (gameState.cards.playerC) {
        for (const card of gameState.cards.playerC) {
          this.expectedCards.set(card, 'playerC');
        }
      }

      const request = {
        phase: "dealing",
        game: gameState.gameType,
        host: this.host,
        roundId,
        game_state: gameState,
      };

      // This will keep the connection open and set up listeners
      await this.setupDealingConnection(request);

      logger.info(
        `Started dealing stream for ${gameState.gameType} round ${roundId}`,
      );
      return "DEALING_STARTED";
    } catch (error) {
      logger.error(`Failed to start dealing phase stream: ${error.message}`);
      this.isStreaming = false;
      this.currentStream = null;
      throw error;
    }
  }

  async setupDealingConnection(request) {
    return new Promise((resolve, reject) => {
      // Create connection to video processor
      const client = net.createConnection(this.socketPath, () => {
        logger.info(`Connected to video processor for dealing phase`);

        try {
          // Send dealing request
          const requestString = JSON.stringify(request) + "\n";
          client.write(requestString);

          // Store the stream connection
          this.currentStream = client;
          this.isStreaming = true;

          // Return immediately without closing the connection
          resolve();
        } catch (error) {
          logger.error(`Error sending dealing request: ${error.message}`);
          client.end();
          reject(error);
        }
      });

      // Set up data handling for the persistent connection
      let dataBuffer = "";

      client.on("data", (data) => {
        const rawData = data.toString();
        logger.debug(`Raw data from stream: ${rawData}`);

        dataBuffer += rawData;
        const messages = dataBuffer.split("\n");
        dataBuffer = messages.pop(); // Keep incomplete messages

        for (const msg of messages) {
          if (!msg.trim()) continue;

          try {
            const response = JSON.parse(msg);
            logger.debug(`Parsed message: ${JSON.stringify(response)}`);

            // Handle card placement events
            if (response.status === "card_placed") {
              const cardCode = this.extractCardCode(response.card);
              logger.info(`Card placed: ${cardCode}`);
              this.emit("cardPlaced", cardCode, response.frame_number);
            }

            // Handle completion event
            else if (response.status === "completed") {
              logger.info(`Dealing phase completed: ${response.message || "No message"}`);
              this.emit("dealingCompleted", response.message || "COMPLETED");
            }

            // Handle other event types as needed
            else if (response.status === "transition") {
              logger.info(`Transition: ${response.transition_type}, duration: ${response.duration}ms`);
              this.emit("transition", response.transition_type, response.duration);
            }

            // Handle errors
            else if (response.status === "error") {
              logger.error(`Video processor error: ${response.message}`);
              this.emit("error", new Error(response.message));
            }
          } catch (e) {
            logger.error(`Failed to parse message: ${msg}`, e);
          }
        }
      });

      client.on("error", (error) => {
        logger.error(`Dealing stream socket error: ${error.message}`);
        this.emit("error", error);
        reject(error);
      });

      client.on("close", () => {
        logger.info(`Dealing stream connection closed`);
        // Only clear if this is the current stream
        if (this.currentStream === client) {
          this.currentStream = null;
          this.isStreaming = false;
        }
        this.emit("connectionClosed");
      });

      // Set a timeout in case the connection hangs
      client.setTimeout(60000, () => {
        logger.error(`Connection Hanging? Dealing stream connection 60s have passed`);
        // client.end();
        // reject(new Error("Connection timeout during dealing phase setup"));
      });
    });
  }

  // Method to wait for a specific card to be revealed
  waitForCard(expectedCard, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeListener('cardPlaced', cardHandler);
        reject(new Error(`Timeout waiting for card: ${expectedCard}`));
      }, timeout);

      const cardHandler = (card) => {
        if (card === expectedCard) {
          clearTimeout(timer);
          this.removeListener('cardPlaced', cardHandler);
          resolve(card);
        }
      };

      this.on('cardPlaced', cardHandler);
    });
  }

  // Method to wait for dealing to complete
  waitForDealingComplete(timeout = 6000000) {
    logger.debug("Waiting for dealing completion event");

    return new Promise((resolve, reject) => {
      // If we're not streaming, fail immediately
      if (!this.isStreaming) {
        logger.warn("Called waitForDealingComplete when not streaming");
        reject(new Error("Not currently streaming"));
        return;
      }

      const timer = setTimeout(() => {
        logger.warn(`Timeout after ${timeout}ms waiting for dealing completion`);
        this.removeListener('dealingCompleted', completeHandler);
        this.removeListener('connectionClosed', closedHandler);
        reject(new Error(`Timeout waiting for dealing completion`));
      }, timeout);

      const completeHandler = (message) => {
        logger.info(`Received dealing completion: ${message}`);
        clearTimeout(timer);
        this.removeListener('dealingCompleted', completeHandler);
        this.removeListener('connectionClosed', closedHandler);
        resolve(message);
      };

      const closedHandler = () => {
        logger.warn("Connection closed before receiving completion event");
        clearTimeout(timer);
        this.removeListener('dealingCompleted', completeHandler);
        this.removeListener('connectionClosed', closedHandler);
        // For robustness, treat connection closed as completion
        resolve("CONNECTION_CLOSED");
      };

      this.on('dealingCompleted', completeHandler);
      this.on('connectionClosed', closedHandler);

      logger.debug("Registered completion event listeners");
    });
  }

  async sendRequest(request) {
    console.info("Sending video request", request);
    // For non-dealing requests, we use a simpler connection pattern
    return new Promise((resolve, reject) => {
      const client = net.createConnection(this.socketPath, () => {
        try {
          const requestString = JSON.stringify(request) + "\n";
          client.write(requestString);

          // For non-dealing requests, we just need an acknowledgment
          let dataBuffer = "";

          client.on("data", (data) => {
            dataBuffer += data.toString();
            try {
              const response = JSON.parse(dataBuffer);
              logger.info(`Received response: ${JSON.stringify(response)}`);

              if (response.status === "received" || response.status === "completed") {
                client.end();
                resolve(response);
              } else if (response.status === "error") {
                client.end();
                reject(new Error(response.message));
              }
            } catch (e) {
              // Incomplete data, keep waiting
            }
          });

        } catch (error) {
          client.end();
          reject(error);
        }
      });

      client.on("error", (error) => {
        logger.error("Video processor connection error:", error);
        reject(error);
      });

      client.on("end", () => {
        // If we didn't already resolve/reject, do it now
        resolve({ status: "acknowledged" });
      });

      client.setTimeout(5000, () => {
        client.end();
        reject(new Error("Connection timeout"));
      });
    });
  }

  async stop(gameType, roundId) {
    try {
      if (!this.isStreaming) {
        logger.info(`No active stream to stop`);
        return;
      }

      // Clean up existing connection
      if (this.currentStream) {
        this.currentStream.end();
        this.currentStream = null;
      }

      const request = {
        phase: "stop",
        game: gameType,
        host: this.host,
        roundId,
        game_state: null,
      };

      await this.sendRequest(request);
      this.isStreaming = false;
      logger.info(`Stopped stream for ${gameType} round ${roundId}`);
    } catch (error) {
      logger.error(`Failed to stop stream:`, error);
      // Reset state even if stop fails
      this.isStreaming = false;
      this.currentStream = null;
      throw error;
    }
  }

  // Helper method to check stream status
  isStreamActive() {
    return this.isStreaming && this.currentStream !== null;
  }
}
