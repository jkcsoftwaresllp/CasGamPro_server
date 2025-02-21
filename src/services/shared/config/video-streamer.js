import net from "net";
import { join } from "path";
import SocketManager from "./socket-manager.js";

export class VideoStreamingService {
  constructor() {
    this.socketPath = "/tmp/video-processor.sock";
    this.host = "HostA";
  }

  async startNonDealingStream(gameType, roundId) {
    const request = {
      type: "start_stream",
      phase: "non_dealing",
      game: gameType,
      host: this.host,
      roundId,
      game_state: null,
    };

    await this.sendRequest(request);
  }

  async startDealingPhase(gameState, roundId) {
    const request = {
      type: "start_stream",
      phase: "dealing",
      game: gameState.gameType,
      host: this.host,
      roundId,
      game_state: gameState,
    };

    await this.sendRequest(request);
  }

  async sendRequest(request) {

    console.log("sending request", request)

    return new Promise((resolve, reject) => {
      const client = net.createConnection(this.socketPath, () => {
        client.write(JSON.stringify(request) + "\n");
        client.end();
        resolve();
      });

      client.on("error", (error) => {
        console.error("Failed to send request to video processor:", error);
        reject(error);
      });
    });
  }

  async stop(roundId) {
    const request = {
      type: "stop_stream",
      roundId,
    };

    await this.sendRequest(request);
  }
}
