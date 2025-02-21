import net from "net";
import { join } from "path";
import SocketManager from "./socket-manager.js";

export class VideoStreamingService {
  constructor() {
    this.socketPath = "/tmp/video-processor.sock";
    this.host = "HostA";
    this.currentConnection = null;
    this.currentPhase = null;
    this.lastFrameTime = 0;
    this.minFrameInterval = 33;
  }

  async startNonDealingStream(gameType, roundId) {
    await this.ensureCleanState();

    this.currentPhase = "non_dealing";
    const sendData = {
      phase: "non_dealing",
      game: gameType,
      host: this.host,
      game_state: null,
    };

    await this.startStream(sendData, roundId);
  }

  async startDealingPhase(gameState, roundId) {
    await this.ensureCleanState();

    this.currentPhase = "dealing";
    const sendData = {
      phase: "dealing",
      game: gameState.gameType,
      host: this.host,
      game_state: gameState,
    };

    await this.startStream(sendData, roundId);
  }

   async ensureCleanState() {
    if (this.currentConnection) {
      await this.stop();
      // Wait a bit to ensure clean shutdown
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async startStream(requestData, roundId) {
    return new Promise((resolve, reject) => {
      try {
        this.currentConnection = net.createConnection(this.socketPath);

        this.currentConnection.on('connect', () => {
          // console.log(`Connected to video processor for ${requestData.phase}`);
          this.currentConnection.write(JSON.stringify(requestData) + "\n");
        });

        this.setupStreamHandlers(this.currentConnection, roundId, resolve, reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  setupStreamHandlers(client, roundId, resolve, reject) {
    let buffer = "";

    client.on("data", (data) => {
      buffer += data.toString();
      const messages = buffer.split("\n");
      buffer = messages.pop();

      for (const msg of messages) {
        try {
          const response = JSON.parse(msg);
          this.handleStreamResponse(response, roundId, client, resolve, reject);
        } catch (error) {
          console.error("Error parsing response:", error);
        }
      }
    });

    client.on("error", (error) => {
      console.error("Stream error:", error);
      this.cleanup();
      reject(error);
    });

    client.on("close", () => {
      // console.log("Stream closed");
      this.cleanup();
    });
  }

  handleStreamResponse(response, roundId, client, resolve, reject) {
    const now = Date.now();

    switch (response.status) {
      case "frame":
        if (this.currentConnection === client &&
            now - this.lastFrameTime >= this.minFrameInterval) {
          SocketManager.broadcastVideoFrame(roundId, {
            frameNumber: response.frame_number,
            frameData: response.frame_data,
            timestamp: now,
            phase: this.currentPhase
          });
          this.lastFrameTime = now;
        }
        break;

      case "complete":
        // console.log("Stream completed");
        client.end();
        resolve();
        break;

      case "error":
        console.error("Stream error:", response.message);
        this.cleanup();
        reject(new Error(response.message));
        break;
    }
  }

  cleanup() {
    if (this.currentConnection) {
      this.currentConnection.end();
      this.currentConnection = null;
    }
    this.currentPhase = null;
  }

  async stop() {
    if (!this.currentConnection) return;

    return new Promise((resolve) => {
      const stopClient = net.createConnection(this.socketPath, () => {
        stopClient.write(JSON.stringify({
          type: "stop",
          phase: this.currentPhase,
        }) + "\n");

        stopClient.end();
        this.cleanup();
        resolve();
      });
    });
  }
}
