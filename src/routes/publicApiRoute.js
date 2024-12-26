import express from "express";
import { loginUser, logoutUser } from "../controller/userController.js";
import { registerUser } from "../controller/registrationController.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, data: "You are using Public API" });
});

// Registration Route
router.post("/register", registerUser);

// Test API
router.get("/check", (req, res) => {
  res.json({ success: true, data: "another api working" });
});

// Login and Logout Routes
router.post("/login", loginUser);
router.post("/logout", logoutUser);

export default router;
