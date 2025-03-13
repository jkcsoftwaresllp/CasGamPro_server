import express from "express";
import { registerUser } from "../controller/registrationController";
import { getDashboard } from "../controller/getDashboard";

const router = express.Router();

router.post("/register-user", registerUser);
router.get("/dashboard", getDashboard);

export default router;
