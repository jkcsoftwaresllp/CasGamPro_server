import express from "express";
import { checkSession } from "../controller/checkSession.js";
import panelRoutes from "./panelRoutesAPI.js";
import { logoutUser } from "../controller/loginLogout.js";
import clientRoutesAPI from "./clientRoutesAPI.js";

const router = express.Router();

//root route
router.get("/", (req, res) => {
  res.json({
    success: true,
    data: "Congratulations! You are using Private API",
  });
});

router.post("/logout", logoutUser);
router.get("/checkSession", checkSession);

router.use("/panel", panelRoutes);
router.use("/client", clientRoutesAPI);

export default router;
