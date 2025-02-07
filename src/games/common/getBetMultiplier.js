import { GAME_TYPES } from "../../services/shared/config/types.js";

export async function getBetMultiplier(gameType, betSide) {
  switch (gameType) {
    case GAME_TYPES.ANDAR_BAHAR_TWO:
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
        even: 2.1,
        black: 1.95,
        red: 1.95,
        specificCard: 12.0,
      };
      return dragonTigerMultipliers[betSide] || 1;

    case GAME_TYPES.ANDAR_BAHAR:
      return 1.96;

    case GAME_TYPES.DRAGON_TIGER_LION:
      const dragonTigerLionMultipliers = {
        winner: 2.9,
        black: 1.97,
        red: 1.97,
        odd: 1.83,
        even: 2.42,
      };
      return dragonTigerLionMultipliers[betSide] || 1;

    default:
      throw new Error(`Unsupported game type: ${gameType}`);
  }
}
