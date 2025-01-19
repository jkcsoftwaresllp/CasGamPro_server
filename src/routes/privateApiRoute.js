import express from "express";
import { gameController } from "../controller/gameController.js";
import { rulesController } from "../controller/rulesController.js";
import { validateRuleFields } from "../middleware/validateRuleFields.js";

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

router.post("/rules", validateRuleFields, rulesController.createRule); //create Rule Route

router.put("/rules/:ruleCode", validateRuleFields, rulesController.updateRule); //update Rule Route

router.get("/rules", validateRuleFields, rulesController.fetchRule); //fetch Rule Route

router.delete("/rules/:ruleCode", rulesController.deleteRule); //delete Rule Route
export default router;
