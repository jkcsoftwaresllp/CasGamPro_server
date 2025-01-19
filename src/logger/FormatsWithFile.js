import { format } from "winston";

// Helper function to extract file name and line number from the stack trace
const extractFileInfo = (stack) => {
  const stackLines = stack.split("\n");
  const callerLine = stackLines[1] || ""; // Adjust index if needed for your runtime
  const match = callerLine.match(/\((.*):(\d+):(\d+)\)/);
  return match ? `${match[1]}:${match[2]}` : "unknown file";
};

export const productionFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.splat(),
  format.printf(({ timestamp, level, message, stack }) => {
    const fileInfo = stack ? extractFileInfo(stack) : "N/A";
    return JSON.stringify({
      timestamp,
      level,
      message,
      file: fileInfo,
      stack: stack || null,
    });
  })
);

export const developmentFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: "HH:mm:ss" }),
  format.errors({ stack: true }),
  format.splat(),
  format.printf(({ timestamp, level, message, stack }) => {
    const fileInfo = stack ? extractFileInfo(stack) : "N/A";
    return stack
      ? `[${timestamp}] ${level}: ${message} (in ${fileInfo})\nStack: ${stack}`
      : `[${timestamp}] ${level}: ${message}`;
  })
);
