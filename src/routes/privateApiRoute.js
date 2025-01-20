import express from "express";
import { gameController } from "../controller/gameController.js";
import { rulesController } from "../controller/rulesController.js";
import { validateRequest } from "../middleware/validateRuleFields.js";
import { authenticate } from "../middleware/isAuth.js";
import { favouriteGameController } from "../controller/favouriteGameController.js";
import { walletController } from "../controller/walletController.js";
import { notificationController } from "./controllers/notificationController.js";
import { gameDetailController } from "../controllers/gameDetailController.js";
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
router.get("/favorite-games", favouriteGameController.getFavoriteGames);

//wallet routes
router.get("/user/wallet", authenticate, walletController.getWallet);

// Notification routes
router.get(
  "/user/notifications",
  authenticate,
  notificationController.getNotification
);

router.post("/notifications", notificationController.addNotification); // Route to add a new notification (admin or authorized users)

//gameDetails routes
router.get("/games", gameDetailController.getGames); // Fetch a list of all available games

router.get("/games/:id", gameDetailController.getGameById); // Fetch details of a specific game by ID
export default router;
