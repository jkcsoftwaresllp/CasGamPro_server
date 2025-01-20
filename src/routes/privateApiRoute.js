import express from "express";
import { gameController } from "../controller/gameController.js";
import { rulesController } from "../controller/rulesController.js";
import { validateRequest } from "../middleware/validateRuleFields.js";
import { authenticate } from "../middleware/isAuth.js";
import { getFavoriteGames } from "../controller/favouriteGameController.js";
import { getWallet } from "../controller/walletController.js";
import {
  getNotification,
  addNotification,
} from "./controllers/notificationController.js";
const router = express.Router();

//root route
router.get("/", (req, res) => {
  res.json({
    success: true,
    data: "Congratulations! You are using Private API",
  });
});

// Game routes
router.get("/games/current", gameController.getCurrentGame);
router.post("/games/bet", gameController.placeBet);
router.get("/games/history", gameController.getGameHistory);

//Rules routes

router.post("/rules", validateRequest, rulesController.createRule);
router.put("/rules/:ruleCode", validateRequest, rulesController.updateRule);
router.get("/rules", validateRequest, rulesController.fetchRule);
router.delete("/rules/:ruleCode", rulesController.deleteRule);

// Favorite games routes
router.get("/favorite-games", getFavoriteGames);

//wallet routes
router.get("/user/wallet", authenticate, getWallet);

// Notification routes
router.get("/user/notifications", authenticate, getNotification);

// Route to add a new notification (admin or authorized users)
router.post("/notifications", addNotification);
export default router;
