import { GAME_TYPES } from "../config/types.js";

export async function getBetMultiplier(gameType, betSide) {

  switch (gameType) {
    case GAME_TYPES.ANDAR_BAHAR_TWO:
      return 1.96; //same for both sides

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
      const teenPattiMultipliers = {
        playera: 1.95,
        playerb: 1.95,
      };
      return teenPattiMultipliers[betSide] || 1.95;

    case GAME_TYPES.DRAGON_TIGER:
      const dragonTigerMultipliers = {
        dragon: 1.96,
        tiger: 1.96,
        tie: 8,
        pair: 6,
        D2: 12,
        D3: 12,
        DA: 12,
        D4: 12,
        D5: 12,
        D6: 12,
        D7: 12,
        D8: 12,
        D9: 12,
        D10: 12,
        DJ: 12,
        DQ: 12,
        DK: 12,
        TA: 12,
        T2: 12,
        T3: 12,
        T4: 12,
        T5: 12,
        T6: 12,
        T7: 12,
        T8: 12,
        T9: 12,
        T10: 12,
        TJ: 12,
        TQ: 12,
        TK: 12,
        tred: 1.95,
        teven: 2.1,
        todd: 1.79,
        tblack: 1.95,
        dred: 1.95,
        deven: 2.1,
        dodd: 1.79,
        dblack: 1.95,
      }
      return dragonTigerMultipliers[betSide] || 1;

    case GAME_TYPES.DRAGON_TIGER_LION:
      const dtlMultipliers = {
        dragon: 2.9,
        tiger: 2.9,
        lion: 2.9,
        DR: 1.97, // Dragon Red
        DB: 1.97, // Dragon Black
        DE: 2.42, // Dragon Even
        DO: 1.83, // Dragon Odd
        TR: 1.97, // Tiger Red
        TB: 2.9, // Tiger Black
        TE: 2.42, // Tiger Even
        TO: 1.83, // Tiger Odd
        LR: 1.97, // Lion Red
        LB: 2.9, // Lion Black
        LE: 2.42, // Lion Even
        LO: 1.83, // Lion Odd
      };
      return dtlMultipliers[betSide] || 1;

    case GAME_TYPES.ANDAR_BAHAR:
      return 1.96;

    default:
      throw new Error(`Unsupported game type: ${gameType}`);
  }
}
