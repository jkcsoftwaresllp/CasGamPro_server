import { getGameCatagories } from "./getGameCategories.js";
import { getCurrentGame } from "./getCurrentGame.js";
import { getGameHistory } from "./getGameHistory.js";
import { placeBet } from "./Betting/placeBet.js";
import { getBettingRange } from "./Betting/getBettingRange.js";
import { getGamesByCategory } from "./getGamesByCategory.js";
import { getWinningHistory } from "./getWinningCards.js";
import { getGameTypes } from "./getGameTypes.js";
import { getGamesByType } from "./getGamesByType.js";
import { unblockGame } from "./unblockGame.js";
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
  unblockGame,
  // getGameConfigs, -->for future implementation
};
