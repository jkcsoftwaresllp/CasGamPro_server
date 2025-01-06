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
router.get("/games/ab1/current", gameController.getCurrentGame);
router.post("/games/ab1/bet", gameController.placeBet);
router.get("/games/ab1/history", gameController.getGameHistory);

export default router;
