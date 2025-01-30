import { folderLogger } from "../../../../logger/folderLogger.js";
import { GAME_TYPES } from "../types.js";

export const loggerGameSendingState = (gameState) => {
  return;
  const logPath = `danishan/${gameState.gameType}`;

  if (Object.values(GAME_TYPES).includes(gameState.gameType)) {
    folderLogger(logPath).info(JSON.stringify(gameState, null, 2));
  }
};
