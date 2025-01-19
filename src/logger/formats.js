import { format } from "winston";

export const productionFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

export const developmentFormat = format.combine(
  format.timestamp({ format: "HH:mm:ss" }),
  format.errors({ stack: true }),
  format.splat(),
  format.printf(({ timestamp, level, message, stack }) => {
    return stack
      ? `[${timestamp}] ${level}: ${message} - ${stack}`
      : `[${timestamp}] ${level}: ${message}`;
  })
);
