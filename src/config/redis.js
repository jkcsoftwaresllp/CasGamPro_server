import Redis from "ioredis";
import { logger } from "../logger/logger.js";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});

redis.on("error", (error) => {
  logger.error("Redis connection error:", error);
});

redis.on("connect", () => {
  logger.info("Connected to Redis");
});

export default redis;
