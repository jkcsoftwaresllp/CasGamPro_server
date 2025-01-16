import redis from "../../config/redis.js";

// Save state for Andar Bahar
export async function saveStateAndarBahar(gameId, jokerCard, andarCards, baharCards, superSaveState) {
  try {
    // Save the generic game state using the parent method
    await superSaveState();

    // Save Andar Bahar-specific state
    await redis.hmset(`game:${gameId}:andarbahar`, {
      jokerCard: jokerCard || "",
      andarCards: JSON.stringify(andarCards || []),
      baharCards: JSON.stringify(baharCards || []),
    });
  } catch (error) {
    console.error(`Failed to save AndarBahar state for ${gameId}:`, error);
  }
}

// Save state for Lucky 7B
export async function saveStateLucky7B(
  gameId,
  blindCard,
  secondCard,
  bettingResults,
  winner,
  superSaveState
) {
  try {
    // Save the generic game state using the parent method
    await superSaveState();

    // Save Lucky 7B-specific state
    await redis.hmset(`game:${gameId}:lucky7b`, {
      blindCard: blindCard ? JSON.stringify(blindCard) : "",
      secondCard: secondCard ? JSON.stringify(secondCard) : "",
      bettingResults: JSON.stringify(bettingResults || {}),
      winner: winner || "",
    });
  } catch (error) {
    console.error(`Failed to save Lucky7B state for ${gameId}:`, error);
  }
}