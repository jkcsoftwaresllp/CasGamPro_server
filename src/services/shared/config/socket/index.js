import { gameHandler } from "../handler.js";
import { walletHandler } from "./walletHandler.js";
import { logger } from "../../../../logger/logger.js";
import { createSocket } from "../../../../config/socket.js";

export const initializeSocket = (server) => {
  const io = createSocket(server);

  const gameIO = gameHandler(io);
  const walletIO = walletHandler(io);

  global.gameIO = gameIO;
  global.walletIO = walletIO;

  logger.info(
    "Sockets Initialized successfully and added globally {gameIO, historyIO, walletIO}"
  );

  return io;
};
