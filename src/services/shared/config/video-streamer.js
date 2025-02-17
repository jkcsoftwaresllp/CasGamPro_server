import net from "net";
import { join } from "path";
import SocketManager from "./socket-manager.js";

export class VideoStreamingService {
  constructor() {
    this.socketPath = "/tmp/video-processor.sock";
  }

  selectRandomHost() {
    const hosts = ["HostA", "HostB"];
    return hosts[Math.floor(Math.random() * hosts.length)];
  }

  async startNonDealingStream(gameType, roundId) {
    const videoPath = join("/path/to/videos", "non-dealing.mp4");

    const host = this.selectRandomHost();

    const sendData = {
      phase: "non_dealing", //this.currentPhase?
      game: gameType,
      host: host,
      game_state: null,
    }

    console.log(sendData);
    this.streamVideo(sendData, roundId);
  }

  async startDealingPhase(gameState) {
    this.streamVideo({
      phase: "dealing",
      game: gameType,
      host: host,
      game_state: gameState,
    });
  }

  streamVideo(requestData, roundId) {
    this.isStreaming = true;

    return new Promise((resolve, reject) => {
      const client = net.createConnection(this.socketPath, () => {
        console.log("Connected to Rust video processor");
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

            // console.log(response.status);

            switch (response.status) {
              case "frame":
                if (this.isStreaming) {
                  SocketManager.broadcastVideoFrame(roundId, {
                    frameNumber: response.frame_number,
                    frameData: response.frame_data,
                    timestamp: Date.now()
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

  stop() {
    this.isStreaming = false;

    // Send stop signal to Rust processor
    const client = net.createConnection(this.socketPath, () => {
      client.write(JSON.stringify({ type: "stop", roundId: this.roundId }) + "\n");
      client.end();
    });
  }
}
