import redis from "../../config/redis.js";

// Recover state for Andar Bahar
export async function recoverStateAndarBahar(gameId, superRecoverState) {
  try {
    await superRecoverState();
    const state = await redis.hgetall(`game:${gameId}:andarbahar`);
    if (state && Object.keys(state).length) {
      return {
        jokerCard: state.jokerCard || null,
        andarCards: JSON.parse(state.andarCards || "[]"),
        baharCards: JSON.parse(state.baharCards || "[]"),
      };
    }
    return null;
  } catch (error) {
    console.error(`Failed to recover AndarBahar state for ${gameId}:`, error);
    return null;
  }
}

// Recover state for Lucky 7B
export async function recoverStateLucky7B(gameId, superRecoverState) {
  try {
    await superRecoverState();
    const state = await redis.hgetall(`game:${gameId}:lucky7b`);
    if (state && Object.keys(state).length) {
      return {
        blindCard: state.blindCard ? JSON.parse(state.blindCard) : null,
        secondCard: state.secondCard ? JSON.parse(state.secondCard) : null,
        bettingResults: state.bettingResults ? JSON.parse(state.bettingResults) : {},
        winner: state.winner || null,
      };
    }
    return null;
  } catch (error) {
    console.error(`Failed to recover Lucky7B state for ${gameId}:`, error);
    return null;
  }
}