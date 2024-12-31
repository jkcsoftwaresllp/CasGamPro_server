import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    data: "Congratulations! You are using Private API",
  });
});

export default router;
