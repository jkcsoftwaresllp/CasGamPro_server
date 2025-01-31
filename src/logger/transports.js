import { join } from "path";
import { transports } from "winston";
import {
  consoleFormat,
  developmentFormat,
  productionFormat,
} from "./formats.js";
import { logsDirectory } from "./getDirectory.js";
import DailyRotateFile from "winston-daily-rotate-file";
import "dotenv/config";

const logsDir = logsDirectory(import.meta.url);

const isProduction = process.env.NODE_ENV === "production";

const DATE_PATTERN = "DD-MM-YYYY",
  MAX_FILE_DAYS = "15d";

// Define transports
export const consoleTransport = new transports.Console({
  format: consoleFormat,
});

export const fileTransport = new DailyRotateFile({
  filename: join(logsDir, "app_%DATE%.log"),
  level: isProduction ? "info" : "debug",
  format: isProduction ? productionFormat : developmentFormat,
  datePattern: DATE_PATTERN,
  maxFiles: MAX_FILE_DAYS,
});

export const errorFileTransport = new DailyRotateFile({
  filename: join(logsDir, "error_%DATE%.log"),
  level: "error",
  format: isProduction ? productionFormat : developmentFormat,
  datePattern: DATE_PATTERN,
  maxFiles: 2 * MAX_FILE_DAYS,
});

export const folderTransport = (folderLogsDir, gameName) => {
  const logTypes = JSON.parse(process.env.LOG_TYPE || "[]");
  const gameNames = process.env.GAME_NAMES ? JSON.parse(process.env.GAME_NAMES) : [];

  const shouldLogSpecificGames = logTypes.includes("Type-5") && gameNames.length > 0;
  const shouldLogAllGames = logTypes.includes("Type-4");

  // Filter logs based on game name if Type-5 is selected
  if (shouldLogSpecificGames && !gameNames.includes(gameName)) {
    return null; // Skip logging for this game
  }


  return new DailyRotateFile({
    filename: join(folderLogsDir, `${gameName}_%DATE%.log`),
    level: isProduction ? "info" : "debug",
    format: isProduction ? productionFormat : developmentFormat,
    datePattern: DATE_PATTERN,
    maxFiles: MAX_FILE_DAYS,
  });
};

export const errorFolderTransport = (folderLogsDir, gameName) => {
  const logTypes = JSON.parse(process.env.LOG_TYPE || "[]");
  const gameNames = process.env.GAME_NAMES ? JSON.parse(process.env.GAME_NAMES) : [];

  const shouldLogSpecificGames = logTypes.includes("Type-5") && gameNames.length > 0;
  const shouldLogAllGames = logTypes.includes("Type-4");

  // Filter logs based on game name if Type-5 is selected
  if (shouldLogSpecificGames && !gameNames.includes(gameName)) {
    return null; // Skip logging for this game
  }

  
  return new DailyRotateFile({
    filename: join(folderLogsDir, `error_${gameName}_%DATE%.log`),
    level: "error",
    format: isProduction ? productionFormat : developmentFormat,
    datePattern: DATE_PATTERN,
    maxFiles: 2 * MAX_FILE_DAYS,
  });
};
