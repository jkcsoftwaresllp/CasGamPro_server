import express from "express";
import { loginUser, logoutUser } from "../controller/userController.js";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, data: "You are using Public API" });
});

router.get("/check", (req, res) => {
  res.json({ success: true, data: "another api working" });
});

router.post("/login", loginUser);
router.post("/logout", logoutUser);

export default router;
