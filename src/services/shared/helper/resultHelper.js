// TODO : generalise it for all other games

import redis from "../../../config/redis.js";
import { logger } from "../../../logger/logger.js";
import { db } from "../../../config/db.js";
import { bets } from "../../../database/schema.js";
import { eq, inArray } from "drizzle-orm";

export const aggregateBets = async (roundId) => {
  try {
    // Fetch all bets for the given roundId
    const betData = await db
      .select()
      .from(bets)
      .where(eq(bets.roundId, roundId));

    // Aggregate the sum manually using JavaScript
    const summary = betData.reduce((acc, bet) => {
      acc[bet.betSide] = (acc[bet.betSide] || 0) + bet.betAmount;
      return acc;
    }, {});

    // Convert the object to an array format
    return Object.entries(summary).map(([betOption, totalBetAmount]) => ({
      betOption,
      totalBetAmount,
    }));
  } catch (error) {
    console.error("Error fetching bet summary:", error);
    throw error;
  }
};

export async function distributeWinnings() {

  if (this.gameType) {
    // Handling cases where there are multiple winners
    // eg- {low: 500, even: 250, black: 400}
    const winningSide = Object.keys(this.bets);
    const betData = await db
      .select()
      .from(bets)
      .where(
        and(
          eq(bets.roundId, this.roundId),
          inArray(winningSide, bets.betSide),
        )
      );


    
    
  } else {
  // Handling cases where there are single winner
    this.bets.includes(this.winner);

  }

}

// export async function aggregateBets(roundId) {
//   return {};
//   // change this to be sql implementation

//   const bets = await redis.hgetall(`bets:${roundId}`);
//   const totals = {};

//   Object.values(bets).forEach((betData) => {
//     const bet = JSON.parse(betData);
//     totals[bet.side] = (totals[bet.side] || 0) + parseFloat(bet.amount);
//   });

//   return totals;
// }
