import { fetchBetsForRound } from "../../../database/queries/balance/distribute.js";

import {
  getAllBets,
  calculationForClients,
  calculationForUpper,
  calculationForAdmin,
} from "./winningDirstributionHelper.js";
import { folderLogger } from "../../../logger/folderLogger.js";

export const aggregateBets = async (roundId) => {
  try {
    // Fetch all bets for the given roundId
    const betData = await fetchBetsForRound(roundId);


    // Aggregate the sum manually using JavaScript
    const summary = betData.reduce((acc, bet) => {
      const adjustedAmount = parseFloat(bet.bet_amount) * parseFloat(bet.multiplier); // Multiply bet_amount by multiplier and parse as float
      acc[bet.bet_side] = (acc[bet.bet_side] || 0) + adjustedAmount; // Add adjusted amount to the accumulator
      return acc;
    }, {});

    return summary;
  } catch (error) {
    console.error("Error fetching bet summary:", error);
    throw error;
  }
};

export async function distributeWinnings() {
  try {
    const winners = this.winner,
      gameType = this.gameType,
      roundId = this.roundId;

    const allBets = await getAllBets(roundId);
    folderLogger("distribution", "profit-distribution").info(
      `################ Round: ${roundId} #################`
    );
    folderLogger("distribution", "profit-distribution").info(
      `******************* Users **********************`
    );

    const agentPL = await calculationForClients(
      allBets,
      winners,
      gameType,
      roundId
    );

    folderLogger("distribution", "profit-distribution").info(
      `******************* Agents **********************`
    );
    const superAgentPL = await calculationForUpper(agentPL, roundId);

    folderLogger("distribution", "profit-distribution").info(
      `******************* Super Agents **********************`
    );
    const adminPL = await calculationForUpper(superAgentPL, roundId);

    folderLogger("distribution", "profit-distribution").info(
      `******************* Admin **********************`
    );
    await calculationForAdmin(adminPL, roundId);

    // Clear the betting maps for next round
    this.bets.clear();
  } catch (error) {
    console.error(
      `Error distributing winnings for round ${this.roundId}:`,
      error
    );
    throw error;
  }
}
