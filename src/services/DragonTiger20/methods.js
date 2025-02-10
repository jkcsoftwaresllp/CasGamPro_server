import { initializeBetTotals, findLeastBetCategory, handleDragonTigerCategory } from "./helper.js";
import { GAME_STATES } from "../shared/config/types.js";
import redis from "../../config/redis.js";

export async function determineOutcome(bets) {
  const betTotals = initializeBetTotals(bets);
  const leastBetCategory = findLeastBetCategory(betTotals);

  let cards = null;
  if (leastBetCategory === "pair" || leastBetCategory === "tie") {
    cards = handlePairTieCategory(leastBetCategory);
  } else {
    cards = handleDragonTigerCategory(leastBetCategory, betTotals);
  }

  this.winner = leastBetCategory;

  this.blindCard = cards.blindCard;
  this.dragonCard = cards.dragonCard;
  this.tigerCard = cards.tigerCard;

  // Assign to playerA (Dragon) and playerB (Tiger)
    this.players.A = this.dragonCard ? [this.dragonCard] : [];  // Dragon
    this.players.B = this.tigerCard ? [this.tigerCard] : [];   // Tiger
}

export async function determineWinner() { // basically reveal card method
  try {
    this.status = GAME_STATES.COMPLETED;
    await this.saveState();

    this.logGameState("Winner Determined");

    // await this.distributeWinnings();
    await this.endGame();
  } catch (error) {
    console.error("Error in determineWinner:", error);
    throw error;
  }
}

export async function distributeWinnings() {
  try {
    const bets = await redis.hgetall(`bets:${this.gameId}`);

    for (const [playerId, betData] of Object.entries(bets)) {
      const bet = JSON.parse(betData);
      const amount = parseFloat(bet.amount);
      const multiplier = await this.getBetMultiplier(bet.side);

      if (bet.side === this.winner) {
        // Winner gets their bet back plus winnings
        const winnings = amount * multiplier;
        await redis.hincrby(`user:${playerId}:balance`, 'amount', winnings);
      } else {
        // Loser loses their bet
        await redis.hincrby(`user:${playerId}:balance`, 'amount', -amount);
      }

      // Clear the active bet
      await redis.hdel(`user:${playerId}:active_bets`, this.gameId);
    }

    this.logGameState("Winnings Distributed");
  } catch (error) {
    console.error("Error in distributeWinnings:", error);
    throw error;
  }
}
