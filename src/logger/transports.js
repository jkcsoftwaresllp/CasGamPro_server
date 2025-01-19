import { join } from "path";
import { transports } from "winston";
import fs from "fs";
import { consoleFormat, fileFormat } from "./formats.js";
import { logsDirectory } from "./getDirectory.js";

const logsDir = logsDirectory(import.meta.url);
const isProduction = process.env.NODE_ENV === "production";

// Define transports
export const consoleTransport = new transports.Console({
  format: consoleFormat,
});

export const fileTransport = new transports.File({
  filename: join(logsDir, "app.log"),
  level: isProduction ? "info" : "debug",
  format: fileFormat,
});

export const errorFileTransport = new transports.File({
  filename: join(logsDir, "error.log"),
  level: "error",
  format: fileFormat,
});

export const folderTransport = (folderLogsDir) => {
  return new transports.File({
    filename: join(folderLogsDir, `app.log`),
    level: isProduction ? "info" : "debug",
    format: fileFormat,
  });
};

export const errorFolderTransport = (folderLogsDir) => {
  return new transports.File({
    filename: join(folderLogsDir, `error.log`),
    level: "error",
    format: fileFormat,
  });
};
