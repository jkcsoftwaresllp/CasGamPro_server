import express from "express";
import {gameController} from "../controller/gameController.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    data: "Congratulations! You are using Private API",
  });
});

// Game routes
router.get("/games/:game/current", gameController.getCurrentGame);
router.post("/games/:game/bet", gameController.placeBet);
router.get("/games/:game/history", gameController.getGameHistory);

export default router;
