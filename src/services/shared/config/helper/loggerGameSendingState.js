import { folderLogger } from "../../../../logger/folderLogger.js";
import { GAME_TYPES } from "../types.js";

export const loggerGameSendingState = (gameState) => {
  const logPath = `gameLogs/${gameState.gameType}`;

  const printible = {
    infor: `${gameState.gameId}: ${gameState.gameType} | ${
      gameState.status || "UD"
    } | ${gameState.winner || "ND"}`,
    cards: `J : ${gameState.cards.jokerCard || "NA"} | B: ${
      gameState.cards.blindCard || "NA"
    } `,
    playerA: gameState.cards.playerA.join(", ") || "UD",
    playerB: gameState.cards.playerB.join(", ") || "UD",
    playerC: gameState.cards.playerC.join(", ") || "UD",
  };

  if (Object.values(GAME_TYPES).includes(gameState.gameType)) {
    folderLogger(logPath).info(JSON.stringify(printible, null, 2));
  }
};
