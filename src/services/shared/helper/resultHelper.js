import redis from "../../../config/redis.js";
import { logger } from "../../../logger/logger.js";

export async function aggregateBets(gameId) {

  // change this to be sql implementation

  const bets = await redis.hgetall(`bets:${gameId}`);
  const totals = {};

  Object.values(bets).forEach((betData) => {
    const bet = JSON.parse(betData);
    totals[bet.side] = (totals[bet.side] || 0) + parseFloat(bet.amount);
  });

  return totals;
}
