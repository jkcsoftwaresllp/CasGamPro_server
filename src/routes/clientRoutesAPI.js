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

const router = express.Router();
// Client Routes

// Game routes
router.get("/games/current", getCurrentGame);
router.post("/games/bet", placeBet);
router.get("/games/history", getGameHistory);

//gameDetails routes
router.get("/categories", getGames); // http://localhost:4320/api/client/categories
router.get("/categories/:categoryId", getGamesByCategory); //http://localhost:4320/api/client/categories/:categoryId
router.get("/categories/games/:id", getGameById); // http://localhost:4320/api/client/categories/games/:id

//Rules routes
router.get("/user/rules", fetchRule); //http://localhost:4320/api/client/user/rules
router.post("/rules", createRule); //http://localhost:4320/api/client/rules
router.put("/rules/:ruleCode", updateRule); //http://localhost:4320/api/client/rules/:ruleCode
router.delete("/rules/:ruleCode", deleteRule); //http://localhost:4320/api/client/rules/:ruleCode

//wallet routes
router.get("/user/wallet", getWallet);

// Notification routes
router.get("/user/notifications", getNotification);
router.post("/notifications", addNotification);

// Favorite games routes
router.get("/favorite-games", getFavouriteGame);

export default router;
