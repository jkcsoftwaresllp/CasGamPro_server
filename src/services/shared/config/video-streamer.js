import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from 'fs';
import net from "net";
import { createReadStream } from "fs";
import { GAME_STATES } from "./types.js";
import SocketManager from "./socket-manager.js";

export class VideoStreamingService {
  constructor(gameType, roundId) {
    this.gameType = gameType;
    this.roundId = roundId;
    this.currentHost = null;
    this.isStreaming = false;
    this.currentPhase = "non-dealing";
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    this.videoBasePath = resolve(__dirname, "../../../videos");
    this.rustSocketPath = "/tmp/video-processor.sock";
    this.frameInterval = 1000 / 30; // 30 FPS
    this.frameCount = 0;
  }

  selectRandomHost() {
    const hosts = ["HostA", "HostB"];
    this.currentHost = hosts[Math.floor(Math.random() * hosts.length)];
    return this.currentHost;
  }

  async startNonDealingStream() {
    if (!this.currentHost) {
      this.selectRandomHost();
    }

    console.log("Host selected:", this.currentHost);
    const videoPath = join("/home/kinxyo/Documents/Corporate/JKCSoftwares/videos/re4.mp4");
    console.log(`Streaming non-dealing video: ${videoPath}`);
    this.streamNonDealingVideo(videoPath);
  }

  async streamNonDealingVideo(videoPath) {
    this.isStreaming = true;
    this.currentPhase = "non-dealing";

    try {
      // Read the file synchronously once to get its content
      const fileContent = fs.readFileSync(videoPath);
      const chunkSize = 1024 * 64; // 64KB chunks
      let offset = 0;

      const sendNextChunk = () => {
        if (!this.isStreaming) return;

        if (offset >= fileContent.length) {
          // Reset to start of file for looping
          offset = 0;
        }

        const chunk = fileContent.slice(offset, offset + chunkSize);
        offset += chunkSize;

        this.frameCount++;
        const now = Date.now();

        // Rate limiting
        if (this.lastFrameTime && now - this.lastFrameTime < this.frameInterval) {
          setTimeout(sendNextChunk, this.frameInterval);
          return;
        }

        this.lastFrameTime = now;

        // Send the chunk
        this.broadcastVideoFrame({
          frameNumber: this.frameCount,
          frameData: chunk.toString('base64'),
          timestamp: now
        });

        // Schedule next chunk
        setTimeout(sendNextChunk, this.frameInterval);
      };

      // Start sending chunks
      sendNextChunk();

    } catch (error) {
      console.error("Error streaming video:", error);
      this.stop();
    }
  }

  async startDealingPhase(winner) {
    this.currentPhase = "dealing";
    const videoPath = join(
      this.videoBasePath,
      this.gameType,
      this.currentHost,
      `${winner}.mp4`
    );

    await this.processDealingVideo(videoPath, winner);
  }

  async processDealingVideo(videoPath, winner) {
    return new Promise((resolve, reject) => {
      const client = net.createConnection(this.rustSocketPath, () => {
        const request = {
          type: "process_video",
          videoPath,
          winner,
          roundId: this.roundId,
        };

        client.write(JSON.stringify(request) + "\n");
      });

      let buffer = "";

      client.on("data", (data) => {
        buffer += data.toString();
        const messages = buffer.split("\n");
        buffer = messages.pop();

        for (const msg of messages) {
          try {
            const response = JSON.parse(msg);

            switch (response.type) {
              case "frame":
                this.broadcastVideoFrame(response);
                break;
              case "complete":
                client.end();
                resolve();
                break;
              case "error":
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
        reject(error);
      });
    });
  }

  broadcastVideoFrame(frameData) {
    // Validate frame data
    if (frameData.frameData) {
      console.log("Frame data:", {
        length: frameData.frameData.length,
        isBuffer: Buffer.isBuffer(frameData.frameData),
        type: typeof frameData.frameData
      });

      // Ensure proper base64 encoding
      if (Buffer.isBuffer(frameData.frameData)) {
        frameData.frameData = frameData.frameData.toString('base64');
      }
    }

    SocketManager.broadcastVideoFrame(this.roundId, {
      phase: this.currentPhase,
      ...frameData,
    });
  }

  stop() {
    this.isStreaming = false;
    this.frameCount = 0;
  }
}
