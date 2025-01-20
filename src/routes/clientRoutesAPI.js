import express from "express";
const router = express.Router();

import { gameController } from "../controller/gameController.js";
import { rulesController } from "../controller/rulesController.js";
import { favouriteGameController } from "../controller/favouriteGameController.js";
import { walletController } from "../controller/walletController.js";
import { notificationController } from "../controller/notificationController.js";
import {
  getGameById,
  getGames,
} from "../controller/gameDetailController/index.js";

// Client Routes

// Game routes
router.get("/games/current", gameController.getCurrentGame);
router.post("/games/bet", gameController.placeBet);
router.get("/games/history", gameController.getGameHistory);

//Rules routes

router.post("/rules", rulesController.createRule);
router.put("/rules/:ruleCode", rulesController.updateRule);
router.get("/rules", rulesController.fetchRule);
router.delete("/rules/:ruleCode", rulesController.deleteRule);

// Favorite games routes
router.get("/favorite-games", favouriteGameController.getFavoriteGames);

//wallet routes
router.get("/user/wallet", walletController.getWallet);

// Notification routes
router.get("/user/notifications", notificationController.getNotification);

router.post("/notifications", notificationController.addNotification); // Route to add a new notification (admin or authorized users)

//gameDetails routes
router.get("/games", getGames); // Fetch a list of all available games
router.get("/games/:id", getGameById); // Fetch details of a specific game by ID

export default router;
