import { join } from "path";
import { transports } from "winston";
import { consoleFormat, fileFormat } from "./formats.js";
import { logsDirectory } from "./getDirectory.js";
import DailyRotateFile from "winston-daily-rotate-file";

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
  format: fileFormat,
  format: fileFormat,
  datePattern: DATE_PATTERN,
  maxFiles: MAX_FILE_DAYS,
});

export const errorFileTransport = new DailyRotateFile({
  filename: join(logsDir, "error_%DATE%.log"),
  level: "error",
  format: fileFormat,
  datePattern: DATE_PATTERN,
  maxFiles: 2 * MAX_FILE_DAYS,
});

export const folderTransport = (folderLogsDir) => {
  return new DailyRotateFile({
    filename: join(folderLogsDir, "app_%DATE%.log"),
    level: isProduction ? "info" : "debug",
    format: fileFormat,
    datePattern: DATE_PATTERN,
    maxFiles: MAX_FILE_DAYS,
  });
};

export const errorFolderTransport = (folderLogsDir) => {
  return new DailyRotateFile({
    filename: join(folderLogsDir, "error_%DATE%.log"),
    level: "error",
    format: fileFormat,
    datePattern: DATE_PATTERN,
    maxFiles: 2 * MAX_FILE_DAYS,
  });
};
