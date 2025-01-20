import { format } from "winston";

const TIME_FORMAT = "HH:mm:ss";
export const productionFormat = format.combine(
  format.timestamp({ format: TIME_FORMAT }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

export const developmentFormat = format.combine(
  format.timestamp({ format: TIME_FORMAT }),
  format.errors({ stack: true }),
  format.splat(),
  format.printf(({ timestamp, level, message, stack }) => {
    return stack
      ? `[${timestamp}] ${level}: ${message} - ${stack}`
      : `[${timestamp}] ${level}: ${message}`;
  })
);

// Define log formats
export const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: TIME_FORMAT }),
  format.printf(
    ({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`
  )
);

export const fileFormat = format.combine(
  format.timestamp({ format: TIME_FORMAT }),
  format.printf(
    ({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`
  )
);
