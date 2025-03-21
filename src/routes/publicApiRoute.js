import express from "express";
import { loginUser } from "../controller/loginLogout.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, data: "You are using Public API" });
});

router.get("/check", (req, res) => {
  res.json({ success: true, data: "another api working" });
});

router.post("/login", loginUser); // http://localhost:4320/api/login

export default router;
