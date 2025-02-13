import { db } from "../../config/db.js";
import { bets } from "../../database/schema.js";
import { eq } from "drizzle-orm";

export const ANDAR_BAHAR_TWO = async (roundId) => {
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

// ANDAR_BAHAR_TWO("").then(console.log).catch(console.error);
