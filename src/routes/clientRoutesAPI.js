import express from "express";
import { getFavouriteGame } from "../controller/favouriteGameController/index.js";
import { toggleFavoriteGame } from "../controller/favouriteGameController/toggleFavoriteGame.js";
import { fetchFilteredData } from "../controller/sortingController.js";
import { addNotification, getNotification } from "../controller/notificationController/index.js";
import { fetchRule, updateRule, createRule, deleteRule } from "../controller/rulesController/index.js";
import { getGameCatagories, placeBet, getBettingRange, getGameHistory, getCurrentGame, getGamesByCategory, getWinningHistory } from "../controller/gameController/index.js";
import { checkBlockingLevel } from "../middleware/checkBlockingLevel.js";
import { getClientLedger } from "../controller/clientLedger/getClientLedger.js";
import { clientStatementAPI } from "../controller/clientLedger/clientStatementAPI.js";
import { changePassword } from "../controller/passwordController/changePassword.js";

const router = express.Router();

// Favorite games routes
router.get("/favorite-games", getFavouriteGame); 
router.post("/toggleFavoriteGame", toggleFavoriteGame); 

// sorting route
router.get("/games/filter", fetchFilteredData);

// Notification routes
router.get("/user/notifications", getNotification); 
router.post("/notifications", addNotification); 

//Rules routes
router.get("/user/rules", fetchRule); 
router.post("/rules", createRule); 
router.put("/rules/:ruleCode", updateRule); 
router.delete("/rules/:ruleCode", deleteRule); 

router.get("/games/current", getCurrentGame);
router.get("/games/betting-range", getBettingRange); 
router.post("/games/place-bet", placeBet); 
router.get("/games/history", getGameHistory); 
router.get("/games/rounds/:roundId/winning-history", getWinningHistory); 
router.get("/games/categories", checkBlockingLevel, getGameCatagories);
router.get("/games/categories/:categoryId", checkBlockingLevel, getGamesByCategory);

router.get("/ledger", getClientLedger);
router.get("/clientStatement", clientStatementAPI);


router.post("/change_password", changePassword);


export default router;
