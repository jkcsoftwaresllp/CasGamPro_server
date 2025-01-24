import net from "net";
import path from "path";
import { logger } from "../../logger/logger.js";
import {
  broadcastVideoFrame,
  broadcastVideoStatus,
} from "../shared/config/handler.js";

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
          output_path: "/tmp/game_videos/AndarBahar.mp4",
        };

        // console.log("Sending request to video processor:", request);

        // broadcastVideoStatus(gameState.gameId, {
        //         type: 'connecting',
        //         message: 'Connecting to video processor'
        //       });
        broadcastVideoStatus(null, {
          type: "connecting",
          message: "Connecting to video processor",
        });

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

            switch (response.status) {
              case "received":
                console.log("Video processing started:", response.message);
                break;

              case "frame":
                const { frame_number, frame_data, total_frames } = response;
                // console.log(`Processing frame ${frame_number}/${total_frames}`);

                // TODO: Stream frames to the client somehow.
                // broadcastVideoFrame(gameState.gameId, {
                //   frameNumber: frame_number,
                //   frameData: frame_data,
                //   totalFrames: total_frames,
                // });

                broadcastVideoFrame(null, {
                  frameNumber: frame_number,
                  frameData: frame_data,
                  totalFrames: total_frames,
                });
                break;

              case "progress":
                break;

              case "completed":
                console.log("Video processing completed");
                client.end();
                resolve(outputPath);
                break;

              case "error":
                broadcastVideoStatus(null, {
                  type: "error",
                  message: response.message,
                });
                return new Error(response.message);
            }
          } catch (err) {
            logger.error("Error parsing response:", err);
          }
        }
      });

      client.on("error", (err) => {
        broadcastVideoStatus(null, {
          type: "error",
          message: err.message,
        });
        reject(err);
      });

      client.on("close", () => {
        logger.info("Connection to video processor closed");
      });
    });
  }
}

export default VideoProcessor;
