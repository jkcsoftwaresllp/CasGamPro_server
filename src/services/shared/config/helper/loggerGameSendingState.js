import { folderLogger } from "../../../../logger/folderLogger.js";
import { GAME_TYPES } from "../types.js";

export const loggerGameSendingState = (gameState) => {
  const logPath = `gameLogs/${gameState.gameType}`;

  const printible = {
    infor: `${gameState.gameId}: ${gameState.gameType} | ${
      gameState.status || "-"
    } | ${gameState.winner || "-"}`,
    cards: `J : ${gameState.cards.jokerCard || "-"} | B: ${
      gameState.cards.blindCard || "-"
    } `,
    playerA: gameState.cards.playerA.join(", ") || "-",
    playerB: gameState.cards.playerB.join(", ") || "-",
    playerC: gameState.cards.playerC.join(", ") || "-",
  };

  if (Object.values(GAME_TYPES).includes(gameState.gameType)) {
    folderLogger(logPath, gameState.gameType).info(
      JSON.stringify(printible, null, 2)
    );
  }
};
