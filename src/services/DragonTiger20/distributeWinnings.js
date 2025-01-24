import redis from "../../config/redis.js";

export async function distributeWinnings(gameInstance) {
  try {
    const bets = await redis.hgetall(`bets:${gameInstance.gameId}`);

    for (const [playerId, betData] of Object.entries(bets)) {
      const bet = JSON.parse(betData);
      const amount = parseFloat(bet.amount);
      const multiplier = await gameInstance.getBetMultiplier(bet.side);
      
      if (bet.side === gameInstance.winner) {
        // Winner gets their bet back plus winnings
        const winnings = amount * multiplier;
        await redis.hincrby(`user:${playerId}:balance`, 'amount', winnings);
      } else {
        // Loser loses their bet
        await redis.hincrby(`user:${playerId}:balance`, 'amount', -amount);
      }
      
      // Clear the active bet
      await redis.hdel(`user:${playerId}:active_bets`, gameInstance.gameId);
    }

    gameInstance.logGameState("Winnings Distributed");
  } catch (error) {
    console.error("Error in distributeWinnings:", error);
    throw error;
  }
}