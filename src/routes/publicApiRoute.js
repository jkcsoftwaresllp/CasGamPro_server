import express from "express";
const router = express.Router();
import {
  getResult,
  getStakes,
  getTopCard,
  setBet,
  startGame,
} from "../controllers/game/index.js";

router.get("/", (req, res) => {
  res.json({ success: true, data: "You are using Public API" });
});

router.get("/startGame", startGame); // http://localhost:4320/api/startGame
router.get("/getTopCard", getTopCard); // http://localhost:4320/api/getTopCard?game_id=game_1733997937211
router.get("/getStakes", getStakes); // http://localhost:4320/api/getStakes
router.get("/getResult", getResult); // http://localhost:4320/api/getResult

router.post("/setBet", setBet); // http://localhost:4320/api/setBet

export default router;
