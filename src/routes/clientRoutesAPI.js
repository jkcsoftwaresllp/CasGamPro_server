import express from "express";
import {
  getWallet,
  walletTransaction,
} from "../controller/walletController/index.js";
import { getFavouriteGame } from "../controller/favouriteGameController/index.js";

import { fetchFilteredData } from "../controller/sortingController.js";

import {
  addNotification,
  getNotification,
} from "../controller/notificationController/index.js";
import {
  fetchRule,
  deleteRule,
  updateRule,
  createRule,
} from "../controller/rulesController/index.js";
import {
  getGameById,
  getGames,
  placeBet,
  getBettingRange,
  getGameHistory,
  getCurrentGame,
  getGamesByCategory,
  getWinningCards,
  getGameTypes,
  getGamesByType,
} from "../controller/gameController/index.js";
import { checkBlockingLevel } from "../middleware/checkBlockingLevel.js";
import { changePassword } from "../controller/passwordController/index.js";
import { getLiveCasinoReports } from '../controller/reportController/index.js';

const router = express.Router();
// Client Routes

router.post("/change_password", changePassword); //http://localhost:4320/auth-api/client/change_password

router.get("/games/current", getCurrentGame);
router.get("/games/betting-range", getBettingRange); // http://localhost:4320/auth-api/client/games/betting-range
router.post("/games/place-bet", placeBet); // http://localhost:4320/auth-api/client/games/place-bet
router.get("/games/history", getGameHistory); // http://localhost:4320/auth-api/client/games/history?gameType=LUCKY7B
router.get("/games/:gameId/rounds/:roundId/winning-cards", getWinningCards);
router.get('/games/types', getGameTypes);
router.get('/games/:gameType', getGamesByType);

//gameDetails routes
router.get("/games/categories", checkBlockingLevel, getGames); // http://localhost:4320/auth-api/client/games/categories
router.get(
  "/games/categories/:categoryId",
  checkBlockingLevel,
  getGamesByCategory
); //http://localhost:4320/auth-api/client/games/categories/:categoryId
router.get("/games/categories/games/:id", checkBlockingLevel, getGameById); // http://localhost:4320/auth-api/client/games/categories/games/:id

//Rules routes
router.get("/user/rules", fetchRule); //http://localhost:4320/auth-api/client/user/rules
router.post("/rules", createRule); //http://localhost:4320/auth-api/client/rules
router.put("/rules/:ruleCode", updateRule); //http://localhost:4320/auth-api/client/rules/:ruleCode
router.delete("/rules/:ruleCode", deleteRule); //http://localhost:4320/auth-api/client/rules/:ruleCode

//wallet routes
router.get("/user/wallet", getWallet); //http://localhost:4320/auth-api/client/user/wallet
//wallet transaction
router.post("/walletTransaction", walletTransaction); //http://localhost:4320/auth-api/client/walletTransaction

// Notification routes
router.get("/user/notifications", getNotification); //http://localhost:4320/auth-api/client/user/notifications
router.post("/notifications", addNotification); //http://localhost:4320/auth-api/client/user/notifications

// Favorite games routes
router.get("/favorite-games", getFavouriteGame); //http://localhost:4320/auth-api/client/favorite-games

// sorting route
router.get("/games/filter", fetchFilteredData);

// Reports routes
router.get('/liveCasinoReports', getLiveCasinoReports);

export default router;
