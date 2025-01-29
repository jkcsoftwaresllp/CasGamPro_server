import express from "express";
import clientRoutesAPI from "./clientRoutesAPI.js";
import agentRoutesAPI from "./agentRoutesAPI.js";
import { checkSession } from "../controller/checkSession.js";
import { getLedgerEntryById } from "../controller/ledgerController.js";
import agentRoutesAPI from "./agentRoutesAPI.js";

const router = express.Router();

//root route
router.get("/", (req, res) => {
  res.json({
    success: true,
    data: "Congratulations! You are using Private API",
  });
});

router.get("/checkSession", checkSession);

// NOTE: client route, will shift it later
router.get("/ledger", getLedgerEntryById);

router.use("/client", clientRoutesAPI);

router.use("/agent", agentRoutesAPI);

export default router;
