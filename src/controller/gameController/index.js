import { getGameCatagories } from "./getGameCatagories.js";
import { getCurrentGame } from "./getCurrentGame.js";
import { getGameHistory } from "./getGameHistory.js";
import { placeBet } from "../gameController/Betting/placeBet.js";
import { getBettingRange } from "./Betting/getBettingRange.js";
import { getGamesByCategory } from "./getGamesByCategory.js";
import { getWinningHistory } from "./getWinningCards.js";
import { getGameTypes } from "./getGameTypes.js";
import { getGamesByType } from "./getGamesByType.js";
// import { getGameConfigs } from "./getGameConfigs.js";   -->for future implementation
export {
  getGameCatagories,
  placeBet,
  getBettingRange,
  getGameHistory,
  getCurrentGame,
  getGamesByCategory,
  getWinningHistory,
  getGameTypes,
  getGamesByType,
  // getGameConfigs, -->for future implementation
};
