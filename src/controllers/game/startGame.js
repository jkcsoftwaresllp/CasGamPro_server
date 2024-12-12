import pool from "../../config/db.js";
import {
  generateGameId,
  generateShuffledDeck,
} from "../helper/startGameHelper.js";

// API: Start Game
export const startGame = async (req, res) => {
  const deck = generateShuffledDeck();

  try {
    await pool.query("INSERT INTO GameState (game_id, deck) VALUES (?, ?)", [
      generateGameId(),
      JSON.stringify(deck),
    ]);
    res.status(201).send("Game started successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to initiate game.");
  }
};
