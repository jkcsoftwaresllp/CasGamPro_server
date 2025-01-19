import { createLogger } from "winston";
import { productionFormat, developmentFormat } from "./formats.js";
import {
  consoleTransport,
  fileTransport,
  errorFileTransport,
} from "./transports.js";

const isProduction = process.env.NODE_ENV === "production";

export const logger = createLogger({
  level: isProduction ? "info" : "debug",
  format: isProduction ? productionFormat : developmentFormat,
  transports: [consoleTransport, fileTransport, errorFileTransport],
});
