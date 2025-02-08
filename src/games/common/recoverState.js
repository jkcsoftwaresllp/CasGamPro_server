import redis from "../../config/redis.js";
import { logger } from "../../logger/logger.js";


export async function recoverState(gameType, gameId, superRecoverState) {
  try {
    await superRecoverState();

    const state = await redis.hgetall(`game:${gameId}:${gameType.toLowerCase()}`);
    if (state && Object.keys(state).length) {
      if (gameType === "AndarBaharTwo") {
        return {
          jokerCard: state.jokerCard || null,
          andarCards: JSON.parse(state.andarCards || "[]"),
          baharCards: JSON.parse(state.baharCards || "[]"),
        };
      }

      if (gameType === "Lucky7B") {
        return {
          blindCard: state.blindCard ? JSON.parse(state.blindCard) : null,
          secondCard: state.secondCard ? JSON.parse(state.secondCard) : null,
          bettingResults: state.bettingResults ? JSON.parse(state.bettingResults) : {},
          winner: state.winner || null,
        };
      }
      if (gameType === "TeenPatti") {
        return {
          player1Cards: state.player1Cards ? JSON.parse(state.player1Cards) : [],
          player2Cards: state.player2Cards ? JSON.parse(state.player2Cards) : [],
          bettingResults: state.bettingResults ? JSON.parse(state.bettingResults) : {},
          pot: state.pot || 0,
          winner: state.winner || null,
        };
      }
      if (gameType === "DragonTiger") {
        return {
          dragonCard: state.dragonCard ? JSON.parse(state.dragonCard) : null,
          tigerCard: state.tigerCard ? JSON.parse(state.tigerCard) : null,
          bettingResults: state.bettingResults ? JSON.parse(state.bettingResults) : {},
          winner: state.winner || null,
        };
      }

      if (gameType === "AndarBahar") {  
        return {
          currentRoundCards: state.currentRoundCards ? JSON.parse(state.currentRoundCards) : [],
          betResults: state.betResults ? JSON.parse(state.betResults) : { andar: [], bahar: [] },
          winner: state.winner || null,
        };
      }

        if (gameType === "DragonTigerLion") {
          return {
            blindCard: state.blindCard ? JSON.parse(state.blindCard) : null,
            playerA: state.playerA ? JSON.parse(state.playerA) : [],
            playerB: state.playerB ? JSON.parse(state.playerB) : [],
            playerC: state.playerC ? JSON.parse(state.playerC) : [],
            bettingResults: state.bettingResults ? JSON.parse(state.bettingResults) : { dragon: [], tiger: [], lion: [] },
            winner: state.winner || null,
          };
        }
      
    }

    return null;
  } catch (error) {
    logger.error(`Failed to recover state for ${gameType} game ${gameId}:`, error);
    return null;
  }
}
