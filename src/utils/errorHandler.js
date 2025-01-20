import { logger } from "../logger/logger.js";

export const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send("Server error");
};
