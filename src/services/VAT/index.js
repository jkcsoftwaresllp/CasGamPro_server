import net from "net";
import path from "path";
import {logger} from "../../logger/logger.js";

class VideoProcessor {
  constructor() {
    this.socketPath = "/tmp/video-processor.sock";
  }

  async processVideo(gameState, outputPath) {
    return new Promise((resolve, reject) => {
      const client = net.createConnection(this.socketPath, () => {
        console.log("Connected to video processor");

        const request = {
          req_type: "game_state_video",
          ...gameState,
          output_path: '/tmp/game_videos/AndarBahar.mp4',
        };

        console.log("Sending request to video processor:", request);

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

            console.log("Received response from video processor:", response);

            switch (response.status) {
              case "progress":
                onProgress?.(response.progress);
                break;

              case "completed":
                client.end();
                resolve(outputPath);
                break;

              case "error":
                throw new Error(response.message);
            }
          } catch (err) {
            logger.error("Error parsing response:", err);
          }
        }
      });

      client.on("error", (err) => {
        reject(err);
      });

      client.on("close", () => {
        logger.info("Connection to video processor closed");
      });
    });
  }
}

export default VideoProcessor;
