import pool from "../../config/db.js";

// API: Set Bet
export const setBet = async (req, res) => {
  const { spectators, player, amount } = req.body;
  try {
    await pool.query(
      "INSERT INTO StakeDetails (spectators, player, amount) VALUES (?, ?, ?)",
      [spectators, player, amount]
    );
    res.status(201).send("Bet placed successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to place bet.");
  }
};
