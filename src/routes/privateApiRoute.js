import express from "express";
import { gameController } from "../controller/gameController.js";
import { rulesController } from "../controller/rulesController.js";

const router = express.Router();

//root route
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

//Rules routes
router.post("/rules", rulesController.createRule);
router.put("/rules/:ruleCode", rulesController.updateRule);
router.get("/rules", rulesController.fetchRule);
router.delete("/rules/:ruleCode", rulesController.deleteRule);
export default router;
