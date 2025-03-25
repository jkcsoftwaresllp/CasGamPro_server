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
      const adjustedAmount =
        parseFloat(bet.betAmount) * parseFloat(bet.multiplier);
      acc[bet.betSide] = (acc[bet.betSide] || 0) + adjustedAmount;
      return acc;
    }, {});

    console.log("DDDD", summary);

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
    // folderLogger("distribution", "profit-distribution").info(
    //   `################ Round: ${roundId} #################`
    // );
    // folderLogger("distribution", "profit-distribution").info(
    //   `******************* Users **********************`
    // );

    const agentsDatail = await calculationForClients(
      allBets,
      winners,
      gameType,
      roundId
    );

    // folderLogger("distribution", "profit-distribution").info(
    //   `******************* Agents **********************`
    // );
    const superAgentsDetail = await calculationForUpper(agentsDatail, roundId);

    // folderLogger("distribution", "profit-distribution").info(
    //   `******************* Super Agents **********************`
    // );
    const adminPL = await calculationForUpper(superAgentsDetail, roundId, true);

    // folderLogger("distribution", "profit-distribution").info(
    //   `******************* Admin **********************`
    // );
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
