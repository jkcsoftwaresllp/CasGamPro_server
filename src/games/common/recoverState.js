import redis from "../../config/redis.js";


export async function recoverState(gameType, gameId, superRecoverState) {
  try {
    await superRecoverState();

    const state = await redis.hgetall(`game:${gameId}:${gameType.toLowerCase()}`);
    if (state && Object.keys(state).length) {
      if (gameType === "AndarBahar") {
        return {
          jokerCard: state.jokerCard || null,
          andarCards: JSON.parse(state.andarCards || "[]"),
          baharCards: JSON.parse(state.baharCards || "[]"),
        };
      }

      if (gameType === "Lucky7B") {
        return {
          blindCard: state.blindCard ? JSON.parse(state.blindCard) : null,
          secondCard: state.secondCard ? JSON.parse(state.secondCard) : null,
          bettingResults: state.bettingResults ? JSON.parse(state.bettingResults) : {},
          winner: state.winner || null,
        };
      }
    }

    return null;
  } catch (error) {
    console.error(`Failed to recover state for ${gameType} game ${gameId}:`, error);
    return null;
  }
}
