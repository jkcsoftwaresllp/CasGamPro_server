import express from "express";
import { getFavouriteGame } from "../controller/favouriteGameController";
import { toggleFavoriteGame } from "../controller/favouriteGameController/toggleFavoriteGame";
import { fetchFilteredData } from "../controller/sortingController";
import { addNotification, getNotification } from "../controller/notificationController";

const router = express.Router();

// Favorite games routes
router.get("/favorite-games", getFavouriteGame); 
router.post("/toggleFavoriteGame", toggleFavoriteGame); 

// sorting route
router.get("/games/filter", fetchFilteredData);

// Notification routes
router.get("/user/notifications", getNotification); 
router.post("/notifications", addNotification); 


export default router;
