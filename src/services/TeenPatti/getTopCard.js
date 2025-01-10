import pool from "../../config/db.js";

export const getTopCard = async (req, res) => {
  const gameId = req.query.game_id;
  try {
    const [results] = await pool.query(
      "SELECT deck FROM GameState WHERE game_id = ?",
      [gameId]
    );

    if (results.length === 0) {
      return res.status(404).send("Game not found.");
    }

    let deck = JSON.parse(results[0].deck);

    if (deck.length === 0) {
      return res.status(400).send("No more cards in the stack.");
    }

    const topCard = deck.pop();

    await pool.query("UPDATE GameState SET deck = ? WHERE game_id = ?", [
      JSON.stringify(deck),
      gameId,
    ]);

    res.status(200).json({ card: topCard });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch or update game state.");
  }
};
