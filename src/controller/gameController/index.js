import { getGameById } from "./getGamebyId.js";
import { getGames } from "./getGames.js";
import { getCurrentGame } from "./getCurrentGame.js";
import { getGameHistory } from "./getGameHistory.js";
import {
  placeBet,
  getValidBetOptions,
} from "../gameController/Betting/placeBet.js";
import { getBettingRange } from "./Betting/getBettingRange.js";
import { getGamesByCategory } from "./getGamesByCategory.js";
import { getWinningCards } from "./getWinningCards.js";

export {
  getGameById,
  getGames,
  placeBet,
  getValidBetOptions,
  getBettingRange,
  getGameHistory,
  getCurrentGame,
  getGamesByCategory,
  getWinningCards,
};
