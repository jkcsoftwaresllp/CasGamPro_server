import net from "net";
import { join } from "path";
import SocketManager from "./socket-manager.js";

export class VideoStreamingService {
  constructor() {
    this.socketPath = "/tmp/video-processor.sock";
    this.host;
    this.isStreaming = false;
    this.currentPhase = null;
  }

  selectRandomHost() {
    const hosts = ["HostA", "HostB"];
    this.host = hosts[Math.floor(Math.random() * hosts.length)];
  }

  async startNonDealingStream(gameType, roundId) {
    if (!this.host) {
      this.selectRandomHost();
    }

    this.currentPhase = "non_dealing";

    const videoPath = join("/path/to/videos", "non-dealing.mp4");

    const sendData = {
      phase: "non_dealing", //this.currentPhase?
      game: gameType,
      host: this.host,
      game_state: null,
    };

    console.log(sendData);
    this.streamVideo(sendData, roundId);
  }

  async startDealingPhase(gameState, roundId) {
    // Stop current stream if any
    await this.stop();

    this.currentPhase = "dealing";

    const sendData = {
      phase: "dealing",
      game: gameState.gameType,
      host: "HostA", //this.host,
      game_state: gameState,
    };
    console.log(`dealing ${roundId}`);
    this.streamVideo(sendData, roundId);
  }

  streamVideo(requestData, roundId) {
    if (this.isStreaming) {
      console.log("Already streaming, stopping current stream");
      this.stop();
    }

    this.isStreaming = true;

    return new Promise((resolve, reject) => {
      const client = net.createConnection(this.socketPath, () => {
        console.log(`Connected to Rust video processor for ${requestData.phase} phase`);
        client.write(JSON.stringify(requestData) + "\n");
      });

      let buffer = "";

      client.on("data", (data) => {
        buffer += data.toString();
        const messages = buffer.split("\n");
        buffer = messages.pop();

        for (const msg of messages) {
          try {
            const response = JSON.parse(msg);

            console.log(response.frame_number)

            switch (response.status) {
              case "frame":
                if (this.isStreaming) {
                  SocketManager.broadcastVideoFrame(roundId, {
                    frameNumber: response.frame_number,
                    frameData: response.frame_data,
                    timestamp: Date.now(),
                  });
                }
                break;

              case "complete":
                console.log("Video stream completed");
                client.end();
                resolve();
                break;

              case "error":
                console.error("Video processor error:", response.message);
                this.stop();
                reject(new Error(response.message));
                break;
            }
          } catch (error) {
            console.error("Error parsing video processor response:", error);
          }
        }
      });

      client.on("error", (error) => {
        console.error("Video processor connection error:", error);
        this.stop();
        reject(error);
      });

      client.on("close", () => {
        console.log("Video processor connection closed");
        this.isStreaming = false;
      });
    });
  }

  async stop() {
    if (!this.isStreaming) return;

    return new Promise((resolve) => {
      console.log(`Stopping ${this.currentPhase} phase video stream`);
      this.isStreaming = false;

      const client = net.createConnection(this.socketPath, () => {
        client.write(
          JSON.stringify({
            type: "stop",
            phase: this.currentPhase,
          }) + "\n",
        );
        client.end();
        resolve();
      });
    });
  }
}
