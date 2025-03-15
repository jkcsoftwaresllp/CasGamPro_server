import express from "express";
import { getClients } from "../controller/clients/getClients";
import { registerUser } from "../controller/registrationController";
import { getDashboard } from "../controller/getDashboard";
import { exposureController } from "../controller/exposureController";
import { getProfitLoss } from "../controller/profitLossController";
import { createInOutEntry } from "../controller/inOutController";
import { inOutReport } from "../controller/inOutReport";

const router = express.Router();

router.get("/clients", getClients);

router.post("/register-user", registerUser);
router.get("/dashboard", getDashboard);
router.get("/exposure/:userId", exposureController);
router.get("/profit-loss", getProfitLoss);
router.post("/inout", createInOutEntry);
router.get("/inout", inOutReport);

export default router;
