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
export const folderLogger = (folderName) => {
  const folderLogsDir = join(logsDir, folderName);
  if (!fs.existsSync(folderLogsDir)) {
    fs.mkdirSync(folderLogsDir, { recursive: true });
  }

  return createLogger({
    level: isProduction ? "info" : "debug",
    format: isProduction ? productionFormat : developmentFormat,
    transports: [
      consoleTransport,
      folderTransport(folderLogsDir),
      errorFolderTransport(folderLogsDir),
    ],
  });
};
