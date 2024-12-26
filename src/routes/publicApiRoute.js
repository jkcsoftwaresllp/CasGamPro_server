import express from "express";
<<<<<<< Updated upstream
import { registerUser } from '../controllers/userController.js';

=======
import { loginUser, logoutUser } from "../controller/userController.js";
import { registerUser } from "../controller/registrationController.js";
>>>>>>> Stashed changes
const router = express.Router();


router.get("/", (req, res) => {
  res.json({ success: true, data: "You are using Public API" });
});

// Registration Route
router.post('/register', registerUser);

<<<<<<< Updated upstream
=======
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
>>>>>>> Stashed changes

export default router;
