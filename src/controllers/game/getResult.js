import pool from "../../config/db.js";

// API: Get Result
export const getResult = async (req, res) => {
  const { gameId } = req.query;
  try {
    const [rows] = await pool.query(
      "SELECT result FROM gamestate WHERE game_id = ?",
      [gameId]
    );

    // Check if the gameId exists in the GameState table
    if (rows.length === 0) {
      return res.status(404).json({ message: "Game not found." });
    }

    // If game exists, return the result (winner)
    const winner = rows[0].result;
    res.status(200).json({ winner });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to retrieve result.");
  }
};
