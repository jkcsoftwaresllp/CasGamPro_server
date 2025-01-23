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
  getWinningCards,
} from "../controller/gameController/index.js";

const router = express.Router();
// Client Routes

// Game routes
router.get("/games/current", getCurrentGame);
router.post("/games/bet", placeBet);
router.get("/games/history", getGameHistory);
router.get("/games/:gameId/rounds/:roundId/winning-cards", getWinningCards);

//gameDetails routes
router.get("/categories", getGames); // Fetch a list of all available games
router.get("/categories/:categoryId", getGamesByCategory);
router.get("/categories/games/:id", getGameById); // Fetch details of a specific game by ID

//Rules routes
router.get("/user/rules", fetchRule);
router.post("/rules", createRule);
router.put("/rules/:ruleCode", updateRule);
router.delete("/rules/:ruleCode", deleteRule);

//wallet routes
router.get("/user/wallet", getWallet);

// Notification routes
router.get("/user/notifications", getNotification);
router.post("/notifications", addNotification);

// Favorite games routes
router.get("/favorite-games", getFavouriteGame);

export default router;
