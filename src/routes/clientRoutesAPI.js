import express from "express";
import { getFavouriteGame } from "../controller/favouriteGameController";
import { toggleFavoriteGame } from "../controller/favouriteGameController/toggleFavoriteGame";
import { fetchFilteredData } from "../controller/sortingController";

const router = express.Router();

// Favorite games routes
router.get("/favorite-games", getFavouriteGame); //http://localhost:4320/auth-api/client/favorite-games
router.post("/toggleFavoriteGame", toggleFavoriteGame); //http://localhost:4320/auth-api/client/addGameFavorite

// sorting route
router.get("/games/filter", fetchFilteredData);


export default router;
