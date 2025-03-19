import express from "express";
import { getFavouriteGame } from "../controller/favouriteGameController";
import { toggleFavoriteGame } from "../controller/favouriteGameController/toggleFavoriteGame";
import { fetchFilteredData } from "../controller/sortingController";
import { addNotification, getNotification } from "../controller/notificationController";
import { fetchRule, updateRule, createRule, deleteRule } from "../controller/rulesController";

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


export default router;
