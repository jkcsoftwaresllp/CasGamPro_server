import express from "express";
import clientRoutesAPI from "./clientRoutesAPI.js";

const router = express.Router();

//root route
router.get("/", (req, res) => {
  res.json({
    success: true,
    data: "Congratulations! You are using Private API",
  });
});

router.use("/client", clientRoutesAPI);

export default router;
