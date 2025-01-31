// src/logger/folderLogger.js
import { createLogger } from "winston";
import { join } from "path";
import fs from "fs";
import { logsDirectory } from "./getDirectory.js";
import { productionFormat, developmentFormat } from "./formats.js";
import {
  folderTransport,
  consoleTransport,
  errorFolderTransport,
} from "./transports.js";
import "dotenv/config";


const logsDir = logsDirectory(import.meta.url);
const isProduction = process.env.NODE_ENV === "production";

// Utility to create a folder-specific logger
export const folderLogger = (folderName, gameName) => {
  const folderLogsDir = join(logsDir, folderName);
  if (!fs.existsSync(folderLogsDir)) {
    fs.mkdirSync(folderLogsDir, { recursive: true });
  }

  const logTypes = JSON.parse(process.env.LOG_TYPE || "[]");
  const gameNames = process.env.GAME_NAMES ? JSON.parse(process.env.GAME_NAMES) : [];

  // If Type-5 is selected, only log for the specific games in GAME_NAMES
  const shouldLogSpecificGames = logTypes.includes("Type-5") && gameNames.length > 0;
  const shouldLogAllGames = logTypes.includes("Type-4");

  // If neither Type-4 nor Type-5 is selected, log everything
  const level = isProduction ? "info" : "debug";

  // Filter based on game name if Type-5 is selected
  const isSpecificGameLog = shouldLogSpecificGames ? gameNames.includes(gameName) : true;

  // Only create logger for specific games if necessary
  if (shouldLogSpecificGames && !isSpecificGameLog) {
    return null; // Return null if we shouldn't log this game
  }

  return createLogger({
    level: isProduction ? "info" : "debug",
    format: isProduction ? productionFormat : developmentFormat,
    transports: [
      consoleTransport,
      folderTransport(folderLogsDir, gameName),
      errorFolderTransport(folderLogsDir, gameName),
    ],
  });
};
