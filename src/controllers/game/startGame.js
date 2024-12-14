import pool from "../../config/db.js";
import { generateGameId } from "../helper/startGameHelper.js";

// API: Start Game
export const startGame = async (req, res) => {
  const gameId = generateGameId();

  try {
    await pool.query("INSERT INTO GameState (game_id, deck) VALUES (?, ?)", [
      gameId,
      JSON.stringify([]),
    ]);

    await pool.query("DELETE FROM stakedetails");
    res.status(201).send({ msg: "Game started successfully.", gameId });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to initiate game.");
  }
};
