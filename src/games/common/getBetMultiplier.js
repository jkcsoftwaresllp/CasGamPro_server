import { GAME_TYPES } from "../../services/shared/config/types.js";

export async function getBetMultiplier(gameType, betSide) {

  switch (gameType) {
    case GAME_TYPES.ANDAR_BAHAR:
      return 1.96;

    case GAME_TYPES.LUCKY7B:
      const lucky7BMultipliers = {
        low: 1.96,
        high: 1.96,
        mid: 2.0,
        even: 2.1,
        odd: 1.79,
        black: 1.95,
        red: 1.95,
      };
      return lucky7BMultipliers[betSide] || 1;

    case GAME_TYPES.TEEN_PATTI:
      return 1.95;

    case GAME_TYPES.DRAGON_TIGER:
      const dragonTigerMultipliers = {
        dragon: 1.96,
        tiger: 1.96,
        tie: 8.0,
        pair: 6.0,
        odd: 1.79,
        even: 2.10,
        black: 1.95,
        red: 1.95,
        specificCard: 12.0,
      };
      return dragonTigerMultipliers[betSide] || 1;

    default:
      throw new Error(`Unsupported game type: ${gameType}`);
  }
}
