import redis from "../../../config/redis.js";
import { logger } from "../../../logger/logger.js";

export async function calculateResult() {
  try {
    const bets = await aggregateBets(this.gameId);

    this.determineOutcome(bets);

  } catch (error) {
    logger.error(`Error calculating result for ${this.gameType}:`, error);
    throw error;
  } finally {
    this.broadcastGameState();
  }
}

async function aggregateBets(gameId) {
  const bets = await redis.hgetall(`bets:${gameId}`);
  const totals = {};

  Object.values(bets).forEach((betData) => {
    const bet = JSON.parse(betData);
    totals[bet.side] = (totals[bet.side] || 0) + parseFloat(bet.amount);
  });

  return totals;
}
