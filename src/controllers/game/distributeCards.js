import pool from "../../config/db.js";
import { getMinimumStakePlayer } from "../helper/getMinimumStakePlayer.js";
import { generateShuffledDeck } from "../helper/startGameHelper.js";
import { compareHands } from "../helper/compareHands.js"; // Import hand comparison function

// Function to generate and distribute cards
export const distributeCards = async (req, res) => {
  const { gameId } = req.body;

  try {
    // Step 1: Fetch stake amounts from the database
    const winningPlayer = await getMinimumStakePlayer(gameId);

    if (!winningPlayer) {
      throw new Error("Failed to determine the player with the lower stake.");
    }

    // Step 2: Generate the deck of 52 cards
    let deck = generateShuffledDeck();

    if (!deck || deck.length !== 52) {
      throw new Error("Deck generation failed or the deck is incomplete.");
    }

    let tie = true;
    let pointer = 0; // Initialize the pointer to track the current subset of cards

    // Step 3 to Step 8: Repeat the process until there's no tie
    while (tie) {
      if (pointer + 7 > deck.length) {
        // Reset the Deck
        deck = generateShuffledDeck();
        pointer = 0;
      }

      // Step 3: Select 7 cards for the game using the pointer
      const selectedCards = deck.slice(pointer, pointer + 7);
      const blindCard = selectedCards[0]; // Blind card (not revealed)

      // Step 4: Distribute the cards
      const player1Cards = selectedCards.slice(1, 4);
      const player2Cards = selectedCards.slice(4, 7);

      // Step 6: Compare hands
      const winningHand = compareHands(player1Cards, player2Cards);

      if (winningHand === 0) {
        // Step 7: Handle tie by incrementing the pointer
        pointer++;
      } else {
        // Step 8: Populate resultData if there's no tie
        tie = false;

        // Determine which player's cards are better based on winningHand
        const winningCards = winningHand === 1 ? player1Cards : player2Cards;
        const losingCards = winningHand === 1 ? player2Cards : player1Cards;

        // Assign the better hand to the lower stake player
        const oddPositionCards =
          winningPlayer === "Player-1" ? winningCards : losingCards;
        const evenPositionCards =
          winningPlayer === "Player-2" ? winningCards : losingCards;

        // Arrange the cards for the database (blind card + alternating distribution)
        const arrangedDeck = [
          blindCard,
          oddPositionCards[0],
          evenPositionCards[0],
          oddPositionCards[1],
          evenPositionCards[1],
          oddPositionCards[2],
          evenPositionCards[2],
        ];

        // Store the game state in the database
        // Update the game state in the database
        await pool.query(
          "UPDATE GameState SET deck = ?, result = ? WHERE game_id = ?",
          [JSON.stringify(arrangedDeck), winningPlayer, gameId]
        );
      }
    }

    // Step 9: Return the result
    return res.status(200).json({
      message: "Ready to start the game.",
    });
  } catch (error) {
    console.error("Error distributing cards:", error);
    return res.status(500).json({
      message: "Error distributing cards.",
      error: error.message,
    });
  }
};
