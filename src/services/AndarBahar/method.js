import { initializeBetTotals, findLeastBetSide, handleCardDistribution } from "./helper.js";
import { GAME_STATES } from "../shared/config/types.js";
import redis from "../../config/redis.js";

export async function determineOutcome(bets) {
  const betTotals = initializeBetTotals(bets);
  const leastBetSide = findLeastBetSide(betTotals);  

  let distributedCards = handleCardDistribution(leastBetSide, betTotals);

  this.winner = leastBetSide;  
  this.currentRoundCards = distributedCards;

  this.playerA = distributedCards.filter(card => card.startsWith("A"));  
  this.playerB = distributedCards.filter(card => card.startsWith("B"));  
}

export async function determineWinner() {
  try {
    this.status = GAME_STATES.COMPLETED;
    await this.saveState();

    this.logGameState("Winner Determined");
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

      const side = bet.side;  
      const cardRank = bet.card.split('')[1]; 
      const leastBetSide = this.winner[cardRank]; 

      if (side === leastBetSide) {
        const winnings = amount * multiplier;
        await redis.hincrby(`user:${playerId}:balance`, 'amount', winnings);
      } else {
        await redis.hincrby(`user:${playerId}:balance`, 'amount', -amount);
      }

      await redis.hdel(`user:${playerId}:active_bets`, this.gameId);
    }

    this.logGameState("Winnings Distributed");
  } catch (error) {
    console.error("Error in distributeWinnings:", error);
    throw error;
  }
}

