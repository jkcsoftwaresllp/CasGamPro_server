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
      await this.sendRequest(request);
      logger.info(`Started dealing stream for ${gameState.gameType} round ${roundId}`);
      return 'SENT'; // Or any value you want to return to confirm the request was sent
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

  async waitForCompletion(gameType, roundId, maxAttempts = 60, interval = 500) {
      let attempts = 0;

      const checkStatus = () => {
          return new Promise((resolve, reject) => {
              const client = net.createConnection(this.socketPath, () => {
                  try {
                      const request = {
                          phase: "check_status",
                          game: gameType,
                          host: this.host,
                          roundId,
                          game_state: null
                      };

                      const requestString = JSON.stringify(request) + "\n";
                      client.write(requestString);

                      client.on("data", (data) => {
                          const responseText = data.toString().trim();
                          try {
                              const response = JSON.parse(responseText);
                              if (response.status === "completed" && response.message === "COMPLETE") {
                                  resolve(true);
                              } else {
                                  resolve(false);
                              }
                          } catch (e) {
                              if (responseText === "COMPLETE") {
                                  resolve(true);
                              } else {
                                  resolve(false);
                              }
                          }
                          client.end();
                      });

                  } catch (error) {
                      reject(error);
                  }
              });

              client.on("error", (error) => {
                  logger.error(`Status check error: ${error.message}`);
                  reject(error);
              });

              client.setTimeout(5000, () => {
                  client.end();
                  reject(new Error("Status check timeout"));
              });
          });
      };

      // Poll until completion or max attempts reached
      while (attempts < maxAttempts) {
          try {
              const isComplete = await checkStatus();
              if (isComplete) {
                  logger.info(`Video processing complete for ${gameType} round ${roundId}`);
                  return true;
              }

              // Wait before next attempt
              await new Promise(resolve => setTimeout(resolve, interval));
              attempts++;

          } catch (error) {
              logger.error(`Polling attempt ${attempts} failed:`, error);
              throw error;
          }
      }

      throw new Error(`Video completion check timed out after ${maxAttempts} attempts`);
  }
}
