import express from "express";
import { getClients } from "../controller/clients/getClients";
const router = express.Router();

router.get("/clients", getClients);

export default router;
