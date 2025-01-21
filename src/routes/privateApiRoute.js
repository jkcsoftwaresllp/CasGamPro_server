import express from "express";
import clientRoutesAPI from "./clientRoutesAPI.js";
import { checkSession } from "../controller/checkSession.js";

const router = express.Router();

//root route
router.get("/", (req, res) => {
  res.json({
    success: true,
    data: "Congratulations! You are using Private API",
  });
});

router.get("/checkSession", checkSession);

router.use("/client", clientRoutesAPI);

export default router;
