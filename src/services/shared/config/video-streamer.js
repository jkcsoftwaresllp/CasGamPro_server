import net from "net";
import { logger } from "../../../logger/logger.js";
import SocketManager from "./socket-manager.js";

export class VideoStreamingService {
  constructor() {
    this.socketPath = "/tmp/video-processor.sock";
    this.host = "HostA";
    this.currentStream = null;
    this.isStreaming = false;
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

      const request = {
        phase: "dealing",
        game: gameState.gameType,
        host: this.host,
        roundId,
        game_state: gameState,
      };

      this.isStreaming = true;
      // Return a promise that resolves when streaming is complete
      return new Promise((resolve, reject) => {
        // Log connection attempt
        logger.info(
          `Connecting to video processor socket at ${this.socketPath}`,
        );

        const client = net.createConnection(this.socketPath, () => {
          try {
            logger.info(
              `Connected to video processor, sending data for ${gameState.gameType} round ${roundId}`,
            );
            const requestString = JSON.stringify(request) + "\n";
            client.write(requestString);
            this.currentStream = client;

            // Set up data listener for completion message
            client.on("data", (data) => {
              const responseText = data.toString().trim();
              logger.info(
                `Received response from video processor: "${responseText}"`,
              );
              try {
                // Try to parse as JSON first
                const response = JSON.parse(responseText);

                // Check for completion in the parsed JSON
                if (
                  response.status === "completed" &&
                  response.message === "COMPLETE"
                ) {
                  logger.info(
                    `Video processing complete for ${gameState.gameType} round ${roundId}`,
                  );
                  this.isStreaming = false;
                  resolve();
                  client.end();
                }
              } catch (e) {
                // If not valid JSON, check for raw COMPLETE string (fallback)
                if (responseText === "COMPLETE") {
                  logger.info(
                    `Video processing complete (raw) for ${gameState.gameType} round ${roundId}`,
                  );
                  this.isStreaming = false;
                  resolve();
                  client.end();
                }
              }
            });
          } catch (error) {
            logger.error(
              `Error sending data to video processor: ${error.message}`,
            );
            reject(error);
          }
        });

        client.on("error", (error) => {
          logger.error(`Video processor connection error: ${error.message}`);
          this.isStreaming = false;
          this.currentStream = null;
          reject(error);
        });

        client.on("close", () => {
          logger.info(`Connection to video processor closed`);
          if (this.currentStream === client) {
            this.currentStream = null;
          }
        });

        // Remove the timeout completely
        // No timeout - wait indefinitely for the COMPLETE message
      });
      let v = 'vvv';
      return v;
    } catch (error) {
      logger.error(`Failed to start dealing phase stream: ${error.message}`);
      this.isStreaming = false;
      throw error;
    }
  }

  async sendRequest(request) {
    console.info("Sending video request", request);
    // if (request.game_state){console.info(request.game_state.cards);};
    return new Promise((resolve, reject) => {
      const client = net.createConnection(this.socketPath, () => {
        try {
          const requestString = JSON.stringify(request) + "\n";
          client.write(requestString);

          this.currentStream = client;

          // logger.info(`Sent video request:`, {
          //   phase: request.phase,
          //   game: request.game,
          //   roundId: request.roundId
          // });

          resolve();
        } catch (error) {
          reject(error);
        } finally {
          client.end();
        }
      });

      client.on("error", (error) => {
        logger.error("Video processor connection error:", error);
        this.isStreaming = false;
        this.currentStream = null;
        reject(error);
      });

      client.on("close", () => {
        if (this.currentStream === client) {
          this.currentStream = null;
        }
      });

      // Set timeout for connection
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
