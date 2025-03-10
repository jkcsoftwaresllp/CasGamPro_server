import { GAME_TYPES, GAME_CONFIGS } from "../config/types.js";

export async function getBetMultiplierFromTypes(gameType, betSide) {
  return GAME_CONFIGS[gameType].multipliers[betSide] || 1;
}

export async function getBetMultiplier(gameType, betSide) {
  switch (gameType) {
    case GAME_TYPES.ANDAR_BAHAR_TWO:
      return 1.96; //same for both sides

    case GAME_TYPES.LUCKY7B:
      const lucky7BMultipliers = {
        low: 1.96,
        high: 1.96,
        mid: 9.0,
        even: 2.1,
        odd: 1.79,
        black: 1.95,
        red: 1.95,
        a: 9,
        2: 9,
        3: 9,
        4: 9,
        5: 9,
        6: 9,
        7: 9,
        8: 9,
        9: 9,
        10: 9,
        j: 9,
        q: 9,
        k: 9,
      };
      // console.log(`Lucky7B multipliers:`, lucky7BMultipliers);
      // console.log(`Multiplier for betSide ${betSide}:`, lucky7BMultipliers[betSide]);
      return lucky7BMultipliers[betSide] || 1;

    case GAME_TYPES.LUCKY7A:
      const lucky7AMultipliers = {
        low: 1.96,
        high: 1.96,
        mid: 9.0,
        even: 2.1,
        odd: 1.79,
        black: 1.95,
        red: 1.95,
        a: 9,
        2: 9,
        3: 9,
        4: 9,
        5: 9,
        6: 9,
        7: 9,
        8: 9,
        9: 9,
        10: 9,
        j: 9,
        q: 9,
        k: 9,
      };
      return lucky7AMultipliers[betSide] || 1;

    case GAME_TYPES.TEEN_PATTI:
      const teenPattiMultipliers = {
        playera: 1.96,
        playerb: 1.96,
      };
      return teenPattiMultipliers[betSide] || 1.96;

    case GAME_TYPES.DRAGON_TIGER:
      const dragonTigerMultipliers = {
        dragon: 1.96,
        tiger: 1.96,
        tie: 8,
        pair: 6,
        d2: 12,
        d3: 12,
        da: 12,
        d4: 12,
        d5: 12,
        d6: 12,
        d7: 12,
        d8: 12,
        d9: 12,
        d10: 12,
        dj: 12,
        dq: 12,
        dk: 12,
        ta: 12,
        t2: 12,
        t3: 12,
        t4: 12,
        t5: 12,
        t6: 12,
        t7: 12,
        t8: 12,
        t9: 12,
        t10: 12,
        tj: 12,
        tq: 12,
        tk: 12,
        tred: 1.95,
        teven: 2.1,
        todd: 1.79,
        tblack: 1.95,
        dred: 1.95,
        deven: 2.1,
        dodd: 1.79,
        dblack: 1.95,
      };
      // console.log(`DragonTiger multipliers:`, dragonTigerMultipliers);
      // console.log(`Multiplier for betSide ${betSide}:`, dragonTigerMultipliers[betSide]);
      return dragonTigerMultipliers[betSide] || 1;

    case GAME_TYPES.DRAGON_TIGER_TWO:
      const dragonTigerTwoMultipliers = {
        dragon: 1.96,
        tiger: 1.96,
        tie: 8,
        pair: 6,
        d2: 12,
        d3: 12,
        da: 12,
        d4: 12,
        d5: 12,
        d6: 12,
        d7: 12,
        d8: 12,
        d9: 12,
        d10: 12,
        dj: 12,
        dq: 12,
        dk: 12,
        ta: 12,
        t2: 12,
        t3: 12,
        t4: 12,
        t5: 12,
        t6: 12,
        t7: 12,
        t8: 12,
        t9: 12,
        t10: 12,
        tj: 12,
        tq: 12,
        tk: 12,
        tred: 1.95,
        teven: 2.1,
        todd: 1.79,
        tblack: 1.95,
        dred: 1.95,
        deven: 2.1,
        dodd: 1.79,
        dblack: 1.95,
      };
      return dragonTigerTwoMultipliers[betSide] || 1;

    case GAME_TYPES.DRAGON_TIGER_LION:
      const dtlMultipliers = {
        dragon: 2.9,
        tiger: 2.9,
        lion: 2.9,
        dr: 1.97, // Dragon Red
        db: 1.97, // Dragon Black
        de: 2.42, // Dragon Even
        do: 1.83, // Dragon Odd
        tr: 1.97, // Tiger Red
        tb: 2.9, // Tiger Black
        te: 2.42, // Tiger Even
        to: 1.83, // Tiger Odd
        lr: 1.97, // Lion Red
        lb: 2.9, // Lion Black
        le: 2.42, // Lion Even
        lo: 1.83, // Lion Odd
      };
      // console.log(`DragonTigerLion multipliers:`, dtlMultipliers);
      // console.log(`Multiplier for betSide ${betSide}:`, dtlMultipliers[betSide]);
      return dtlMultipliers[betSide] || 1;

    case GAME_TYPES.ANDAR_BAHAR:
      return 1.96;

    default:
      throw new Error(`Unsupported game type: ${gameType}`);
  }
}
