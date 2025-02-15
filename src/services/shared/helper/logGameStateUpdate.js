import { folderLogger } from "../../../logger/folderLogger.js";
import {
  ENV_GAME_NAMES,
  ENV_LOG_TYPE,
  ENV_TYPE_4,
  ENV_TYPE_5,
} from "../../../utils/envTypes.js";

export const logGameStateUpdate = (gameState) => {
  console.log(gameState);
  // console.log(gameState.status);
  return ;
  const logPath = `gameLogs/${gameState.gameType}`;
  const printable = {
    info: `${gameState.roundId}: ${gameState.gameType} | ${
      gameState.status || "-"
    } | ${gameState.winner || "-"}`,
    cards: `J: ${gameState.cards.jokerCard || "-"} | B: ${
      gameState.cards.blindCard || "-"
    }`,
    playerA: gameState.cards.playerA.join(", ") || "-",
    playerB: gameState.cards.playerB.join(", ") || "-",
    playerC: gameState.cards.playerC.join(", ") || "-",
  };
  // Logging Conditions:
  // Type-4: Logs all game types
  // Type-5: Logs only selected games in ENV_GAME_NAMES
  if (
    ENV_LOG_TYPE.includes(ENV_TYPE_4) ||
    (ENV_LOG_TYPE.includes(ENV_TYPE_5) &&
      ENV_GAME_NAMES.includes(gameState.gameType))
  ) {
    folderLogger(logPath, gameState.gameType).info(
      JSON.stringify(printable, null, 2)
    );
  }
};
