import redis from "../../config/redis.js";

// Andar Bahar: Store game result
export async function storeGameResultAndarBahar(gameInstance) {
  const result = {
    gameId: gameInstance.gameId,
    jokerCard: gameInstance.jokerCard,
    andarCards: gameInstance.andarCards,
    baharCards: gameInstance.baharCards,
    winner: gameInstance.winner,
    timestamp: Date.now(),
  };

  try {
    await redis.lpush("game_history", JSON.stringify(result));
    await redis.ltrim("game_history", 0, 99); // Keep the last 100 games
  } catch (error) {
    console.error(`Failed to store AndarBahar game result for ${gameInstance.gameId}:`, error);
  }
}

// Lucky 7B: Store game result
export async function storeGameResultLucky7B(gameInstance) {
  try {
    const result = {
      gameId: gameInstance.gameId,
      winner: gameInstance.winner,
      blindCard: gameInstance.blindCard,
      secondCard: gameInstance.secondCard,
      bettingResults: gameInstance.bettingResults,
      timestamp: Date.now(),
    };

    await redis.lpush("game_history", JSON.stringify(result));
    await redis.ltrim("game_history", 0, 99);
  } catch (error) {
    console.error(`Failed to store Lucky7B game result for ${gameInstance.gameId}:`, error);
  }
}
