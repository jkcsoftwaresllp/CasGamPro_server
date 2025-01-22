import express from "express";
import { getWallet } from "../controller/walletController/index.js";
import { getFavouriteGame } from "../controller/favouriteGameController/index.js";
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
  getGameHistory,
  getCurrentGame,
  getGamesByCategory,
} from "../controller/gameController/index.js";
import { checkBlockingLevel } from "../middleware/checkBlockingLevel.js";

const router = express.Router();
// Client Routes

// Game routes
router.get("/games/current", checkBlockingLevel, getCurrentGame);
router.post("/games/bet", checkBlockingLevel, placeBet);
router.get("/games/history", checkBlockingLevel, getGameHistory);

//gameDetails routes
router.get("/games/categories", checkBlockingLevel, getGames); // http://localhost:4320/api/client/games/categories
router.get(
  "/games/categories/:categoryId",
  checkBlockingLevel,
  getGamesByCategory
); //http://localhost:4320/api/client/games/categories/:categoryId
router.get("/games/categories/games/:id", checkBlockingLevel, getGameById); // http://localhost:4320/api/client/games/categories/games/:id

//Rules routes
router.get("/user/rules", fetchRule); //http://localhost:4320/api/client/user/rules
router.post("/rules", createRule); //http://localhost:4320/api/client/rules
router.put("/rules/:ruleCode", updateRule); //http://localhost:4320/api/client/rules/:ruleCode
router.delete("/rules/:ruleCode", deleteRule); //http://localhost:4320/api/client/rules/:ruleCode

//wallet routes
router.get("/user/wallet", getWallet); //http://localhost:4320/api/client/user/wallet

// Notification routes
router.get("/user/notifications", getNotification); //http://localhost:4320/api/client/user/notifications
router.post("/notifications", addNotification); //http://localhost:4320/api/client/user/notifications

// Favorite games routes
router.get("/favorite-games", getFavouriteGame); //http://localhost:4320/api/client/favorite-games

export default router;
