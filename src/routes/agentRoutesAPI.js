import express from "express";
import { registerUser } from "../controller/registrationController";

const router = express.Router();

router.post("/register-user", registerUser);

export default router;
