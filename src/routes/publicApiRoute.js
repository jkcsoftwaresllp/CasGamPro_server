import express from "express";
import { loginUser, logoutUser } from "../controller/userController.js";
import { registerUser } from "../controller/registrationController.js";
const router = express.Router();


router.get("/", (req, res) => {
  res.json({ success: true, data: "You are using Public API" });
});

// Registration Route
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

export default router;
