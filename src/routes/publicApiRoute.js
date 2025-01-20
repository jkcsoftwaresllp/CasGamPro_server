import express from "express";
import { loginUser, logoutUser } from "../controller/userController.js";
import { registerUser } from "../controller/registrationController.js";
import clientRoutesAPI from "./clientRoutesAPI.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, data: "You are using Public API" });
});

router.get("/check", (req, res) => {
  res.json({ success: true, data: "another api working" });
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

router.use("/client", clientRoutesAPI);

export default router;
