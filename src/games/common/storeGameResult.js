import redis from "../../config/redis.js";
import { logger } from "../../logger/logger.js";
import { GAME_TYPES } from "../../services/shared/config/types.js";

export async function storeGameResult() {
  return ;
  try {
    const result = {
      gameId: this.gameId,
      timestamp: Date.now(),
    };

    switch (this.gameType) {
      case GAME_TYPES.ANDAR_BAHAR_TWO:
        result.jokerCard = this.jokerCard;
        result.andarCards = this.andarCards;
        result.baharCards = this.baharCards;
        result.winner = this.winner;
        break;

      case GAME_TYPES.LUCKY7B:
        result.winner = this.winner;
        result.blindCard = this.blindCard;
        result.secondCard = this.secondCard;
        result.bettingResults = this.bettingResults;
        break;

      case GAME_TYPES.TEEN_PATTI:
        result.winner = this.winner;
        result.blindCard = this.blindCard;
        result.player1Cards = this.player1Cards;
        result.player2Cards = this.player2Cards;
        result.bettingResults = this.bettingResults;
        break;

      case GAME_TYPES.DRAGON_TIGER:
        result.winner = this.winner;
        result.dragonCard = this.dragonCard;
        result.tigerCard = this.tigerCard;
        result.bettingResults = this.bettingResults;
        break;

        case GAME_TYPES.ANDAR_BAHAR:
        result.winner = this.winner;
        result.andarCards = this.currentRoundCards.filter(
          (card) => card.side === "andar"
        );
        result.baharCards = this.currentRoundCards.filter(
          (card) => card.side === "bahar"
        );
        result.betResults = this.betResults;
        result.totalBets = this.betsPlaced;
        break;

        case GAME_TYPES.DRAGON_TIGER_LION:
        result.winner = this.winner;
        result.dragonCard = this.playerA[0]; 
        result.tigerCard = this.playerB[0]; 
        result.lionCard = this.playerC[0]; 
        result.bettingResults = this.bettingResults; 
        break;

      default:
        logger.warn(`Unknown game type: ${this.gameType}`);
        return;
    }

    await redis.lpush("game_history", JSON.stringify(result));
    await redis.ltrim("game_history", 0, 99); // Keep the last 100 games
  } catch (error) {
    logger.error(
      `Failed to store ${this.gameType} game result for ${this.gameId}:`,
      error
    );
  }
}
