import express from "express";
import { getClients } from "../controller/clients/getClients";
import { registerUser } from "../controller/registrationController";
import { getDashboard } from "../controller/getDashboard";

const router = express.Router();

router.get("/clients", getClients);

router.post("/register-user", registerUser);
router.get("/dashboard", getDashboard);

export default router;
