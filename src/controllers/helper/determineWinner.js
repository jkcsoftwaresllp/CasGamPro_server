import pool from "../../config/db.js"; // For database connection
import { evaluateHand } from "./evaluateHand.js";
import { generateShuffledDeck } from "./shuffleDeck.js"; // Assuming the shuffle function is in shuffleDeck.js

export const determineWinner = async () => {
  try {
    // Step 1: Fetch stake amounts for Player-1 and Player-2 from the database
    const result = await pool.query("SELECT player, amount FROM StakeDetails");

    // Extract amounts for both players
    let player1Amount = 0;
    let player2Amount = 0;

    result.rows.forEach((row) => {
      if (row.player === "Player-1") player1Amount += parseFloat(row.amount);
      if (row.player === "Player-2") player2Amount += parseFloat(row.amount);
    });

    // Step 2: Shuffle deck and deal 6 cards
    const deck = generateShuffledDeck();
    const player1Hand = deck.slice(0, 3); // Player-1 gets 3 cards
    const player2Hand = deck.slice(3, 6); // Player-2 gets 3 cards

    // Step 3: Evaluate the hands
    const player1HandRank = evaluateHand(player1Hand);
    const player2HandRank = evaluateHand(player2Hand);

    // Step 4: Determine the winner based on hand strength
    let winner;
    if (player1HandRank === "High Card" && player2HandRank !== "High Card") {
      winner = "Player-2";
    } else if (
      player2HandRank === "High Card" &&
      player1HandRank !== "High Card"
    ) {
      winner = "Player-1";
    } else if (player1HandRank === player2HandRank) {
      // If both have same rank, decide based on stake
      winner = player1Amount < player2Amount ? "Player-1" : "Player-2";
    } else {
      // Simplified: Compare hand ranks
      const handRankOrder = [
        "High Card",
        "Pair",
        "Sequence",
        "Pure Sequence",
        "Color",
      ];
      winner =
        handRankOrder.indexOf(player1HandRank) >
        handRankOrder.indexOf(player2HandRank)
          ? "Player-1"
          : "Player-2";
    }

    // Step 5: Return the winner and the hands dealt
    return {
      winner,
      player1Hand,
      player2Hand,
      player1HandRank,
      player2HandRank,
    };
  } catch (error) {
    console.error("Error determining winner:", error);
    throw new Error("Error determining winner");
  }
};
