import { GAME_STATES } from "../shared/config/types.js";
import { generateHand, generateWinnerHand, generateLosingHand } from "./helper.js";
import redis from "../../config/redis.js";

export async function determineWinner() {
  try {
    this.status = GAME_STATES.COMPLETED;
    this.real_winner = this.winner;
    await this.distributeWinnings();
    await this.end();
  } catch (error) {
    console.error("Error in determineWinner:", error);
    throw error;
  }
}

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
  } catch (error) {
    console.error("Error in distributeWinnings:", error);
    throw error;
  }
}

export  { generateLosingHand };
export { generateWinnerHand };
