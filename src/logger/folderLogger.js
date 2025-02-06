// src/logger/folderLogger.js
import { createLogger } from "winston";
import { join } from "path";
import fs from "fs";
import { logsDirectory } from "./getDirectory.js";
import { productionFormat, developmentFormat } from "./formats.js";
import { folderTransport, errorFolderTransport } from "./transports.js";
import "dotenv/config";

const logsDir = logsDirectory(import.meta.url);
const isProduction = process.env.NODE_ENV === "production";

export const folderLogger = (folderName, gameName) => {
  const folderLogsDir = join(logsDir, folderName);
  if (!fs.existsSync(folderLogsDir)) {
    fs.mkdirSync(folderLogsDir, { recursive: true });
  }

  // Create separate loggers for info and error
  const infoLogger = createLogger({
    level: "info",
    format: isProduction ? productionFormat : developmentFormat,
    transports: [folderTransport(folderLogsDir, gameName)],
  });

  const errorLogger = createLogger({
    level: "error",
    format: isProduction ? productionFormat : developmentFormat,
    transports: [errorFolderTransport(folderLogsDir, gameName)],
  });

  return {
    info: (message) => infoLogger.info(message),
    error: (message) => errorLogger.error(message),
  };
};
