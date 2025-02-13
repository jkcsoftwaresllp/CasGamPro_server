import { logger } from "../logger/logger.js";
import GameFactory from "./shared/config/factory.js";
import gameManager from "./shared/config/manager.js";

export async function initializeGameServices() {
  try {
    // Only initialize the manager
    logger.info('Game Manager initialized and ready for connections');
  } catch (error) {
    logger.error("Failed to initialize game services:", error);
  }
}
