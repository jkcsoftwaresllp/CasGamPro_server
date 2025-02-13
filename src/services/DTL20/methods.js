import { GAME_STATES } from "../shared/config/types.js";
import { generateHand, generateWinnerHand, generateLosingHand } from "./helper.js";
import redis from "../../config/redis.js";

export async function determineWinner() {
  try {
    this.status = GAME_STATES.COMPLETED;
    this.real_winner = this.winner;
    await this.end();
  } catch (error) {
    console.error("Error in determineWinner:", error);
    throw error;
  }
}

export  { generateLosingHand };
export { generateWinnerHand };
