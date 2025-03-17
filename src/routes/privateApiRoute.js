import express from "express";
import { checkSession } from "../controller/checkSession.js";

const router = express.Router();

//root route
router.get("/", (req, res) => {
  res.json({
    success: true,
    data: "Congratulations! You are using Private API",
  });
});

router.get("/checkSession", checkSession);

export default router;
