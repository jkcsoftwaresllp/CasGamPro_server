import express from "express";
import { registerUser } from '../controllers/userController.js';

const router = express.Router();


router.get("/", (req, res) => {
  res.json({ success: true, data: "You are using Public API" });
});

// Registration Route
router.post('/register', registerUser);


export default router;
