import { Server } from "socket.io";
import { gameHandler } from "../handler.js";
import { gameHistoryHandler } from "./gameHistoryHandler.js";
import { walletHandler } from "./walletHandler.js";
import { logger } from "../../../../logger/logger.js";

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  const gameIO = gameHandler(io);

  const historyIO = gameHistoryHandler(io);

  const walletIO = walletHandler(io);

  global.io = io;
  global.gameIO = gameIO;
  global.historyIO = historyIO;
  global.walletIO = walletIO;

  logger.info("Socket.IO initialized successfully");

  return io;
};