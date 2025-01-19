import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { format, transports } from "winston";
import fs from "fs";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure logs directory exists
const logsDir = join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log formats
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: "HH:mm:ss" }),
  format.printf(
    ({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`
  )
);

const fileFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(
    ({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`
  )
);

// Define transports
export const consoleTransport = new transports.Console({
  format: consoleFormat,
});

export const fileTransport = new transports.File({
  filename: join(logsDir, "app.log"),
  level: "info",
  format: fileFormat,
});

export const errorFileTransport = new transports.File({
  filename: join(logsDir, "error.log"),
  level: "error",
  format: fileFormat,
});
