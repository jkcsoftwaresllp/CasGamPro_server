import express from "express";
const router = express.Router();


router.get("/", (req, res) => {
  res.json({ success: true, data: "You are using Public API" });
});


export default router;
