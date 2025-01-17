import redis from "../../config/redis.js";

export async function storeGameResult(gameType, gameInstance) {
  try {
    const result = {
      gameId: gameInstance.gameId,
      timestamp: Date.now(),
    };

    if (gameType === "AndarBahar") {
      result.jokerCard = gameInstance.jokerCard;
      result.andarCards = gameInstance.andarCards;
      result.baharCards = gameInstance.baharCards;
      result.winner = gameInstance.winner;
    } else if (gameType === "Lucky7B") {
      result.winner = gameInstance.winner;
      result.blindCard = gameInstance.blindCard;
      result.secondCard = gameInstance.secondCard;
      result.bettingResults = gameInstance.bettingResults;
    }

    await redis.lpush("game_history", JSON.stringify(result));
    await redis.ltrim("game_history", 0, 99); // Keep the last 100 games
  } catch (error) {
    console.error(`Failed to store ${gameType} game result for ${gameInstance.gameId}:`, error);
  }
}
