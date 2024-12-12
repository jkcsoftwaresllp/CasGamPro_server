import { generateGameId, generateShuffledDeck } from "../helper/startGameHelper";

// API: Start Game
export const startGame = (req, res) => {
    const deck = generateShuffledDeck();
  
    pool.query(
      "INSERT INTO GameState (game_id, deck) VALUES (?, ?)",
      [generateGameId(), JSON.stringify(deck)],
      (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Failed to initiate game.");
        }
        res.status(201).send("Game started successfully.");
      }
    );
  };