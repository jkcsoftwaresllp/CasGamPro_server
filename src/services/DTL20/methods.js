import { GAME_STATES } from "../shared/config/types.js";
import {
  generateSideCard,
  getSuitRanking,
  getRankRanking,
} from "./helper.js";
import redis from "../../config/redis.js";

export async function distributeWinnings() {
  try {
    const multiplier = await this.getBetMultiplier();
    const bets = await redis.hgetall(`bets:${this.gameId}`);

    for (const [playerId, betData] of Object.entries(bets)) {
      const bet = JSON.parse(betData);
      const amount = parseFloat(bet.amount);

      if (bet.side === this.winner) {
        const winnings = amount * multiplier;
        await redis.hincrby(`user:${playerId}:balance`, "amount", winnings);
      } else {
        await redis.hincrby(`user:${playerId}:balance`, "amount", -amount);
      }
      await redis.hdel(`user:${playerId}:active_bets`, this.gameId);
    }

    this.logGameState("Winnings Distributed");
  } catch (error) {
    console.error("Error in distributeWinnings:", error);
    throw error;
  }
}
