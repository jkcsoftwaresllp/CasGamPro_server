import { eq } from "drizzle-orm";
import { db } from "../../../config/db.js";
import { games } from "../../../database/schema.js";

export const getGameConfig = async (gameType) => {
  const [result] = await db
    .select()
    .from(games)
    .where(eq(games.gameType, gameType));

  return result;
};

// TODO: Contert then all to used from database schema

export const GAME_TYPES = {
  ANDAR_BAHAR_TWO: "ANDAR_BAHAR_TWO",
  LUCKY7B: "LUCKY7B",
  LUCKY7A: "LUCKY7A",
  TEEN_PATTI: "TEEN_PATTI",
  DRAGON_TIGER: "DRAGON_TIGER",
  DRAGON_TIGER_TWO: "DRAGON_TIGER_TWO",
  ANDAR_BAHAR: "ANDAR_BAHAR",
  DRAGON_TIGER_LION: "DRAGON_TIGER_LION",
};

export const GAME_STATES = {
  WAITING: "waiting",
  BETTING: "betting",
  DEALING: "dealing",
  COMPLETED: "completed",
};

export const GAME_CONFIGS = {
  [GAME_TYPES.ANDAR_BAHAR_TWO]: {
    id: "AB2",
    name: "Andar Bahar 2",
    betSides: ["andar", "bahar"],
    multipiers: { andar: 1.96, bahar: 1.96 },
    bettingDuration: 2500,
    cardDealInterval: 3000,
  },

  [GAME_TYPES.LUCKY7B]: {
    id: "L7B",
    name: "Lucky 7B",
    betSides: [
      "low",
      "high",
      "mid",
      "odd",
      "even",
      "black",
      "red",
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ],
    multipliers: {
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
    },
    bettingDuration: 20000,
    cardDealInterval: 3000,
  },

  [GAME_TYPES.LUCKY7A]: {
    id: "L7A",
    name: "Lucky 7A",
    betSides: [
      "low",
      "high",
      "mid",
      "odd",
      "even",
      "black",
      "red",
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ],
    multipliers: {
      low: 1.96,
      high: 1.96,
      mid: 9,
      odd: 1.79,
      even: 2.1,
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
    },
    bettingDuration: 20000,
    cardDealInterval: 3000,
  },

  [GAME_TYPES.TEEN_PATTI]: {
    id: "TP1",
    name: "Teen Patti T20",
    betSides: ["playerA", "playerB"],
    multipliers: { playerA: 1.96, playerB: 1.96 },
    bettingDuration: 30000,
    cardDealInterval: 3000,
    cardsPerPlayer: 3,
  },

  [GAME_TYPES.DRAGON_TIGER]: {
    id: "DT20",
    name: "Dragon Tiger 20-20",
    betSides: [
      "dragon",
      "tiger",
      "tie",
      "pair",
      "D2",
      "D3",
      "DA",
      "D4",
      "D5",
      "D6",
      "D7",
      "D8",
      "D9",
      "D10",
      "DJ",
      "DQ",
      "DK",
      "TA",
      "T2",
      "T3",
      "T4",
      "T5",
      "T6",
      "T7",
      "T8",
      "T9",
      "T10",
      "TJ",
      "TQ",
      "TK",
      "tred",
      "teven",
      "todd",
      "tblack",
      "dred",
      "deven",
      "dodd",
      "dblack",
    ],
    multipliers: {
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
    },
    bettingDuration: 20000,
    cardDealInterval: 3000,
  },

  [GAME_TYPES.DRAGON_TIGER_TWO]: {
    id: "DT20TWO",
    name: "Dragon Tiger 20-20 TWO",
    betSides: [
      "dragon",
      "tiger",
      "tie",
      "pair",
      "D2",
      "D3",
      "DA",
      "D4",
      "D5",
      "D6",
      "D7",
      "D8",
      "D9",
      "D10",
      "DJ",
      "DQ",
      "DK",
      "TA",
      "T2",
      "T3",
      "T4",
      "T5",
      "T6",
      "T7",
      "T8",
      "T9",
      "T10",
      "TJ",
      "TQ",
      "TK",
      "tred",
      "teven",
      "todd",
      "tblack",
      "dred",
      "deven",
      "dodd",
      "dblack",
    ],
    multipliers: {
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
    },
    bettingDuration: 20000,
    cardDealInterval: 3000,
  },

  [GAME_TYPES.ANDAR_BAHAR]: {
    id: "AB1",
    name: "Andar Bahar 1",
    betSides: [
      "A2",
      "A3",
      "AA",
      "A4",
      "A5",
      "A6",
      "A7",
      "A8",
      "A9",
      "A10",
      "AJ",
      "AQ",
      "AK",
      "BA",
      "B2",
      "B3",
      "B4",
      "B5",
      "B6",
      "B7",
      "B8",
      "B9",
      "B10",
      "BJ",
      "BQ",
      "BK",
    ],
    multipliers: {
      A2: 1.96,
      A3: 1.96,
      AA: 1.96,
      A4: 1.96,
      A5: 1.96,
      A6: 1.96,
      A7: 1.96,
      A8: 1.96,
      A9: 1.96,
      A10: 1.96,
      AJ: 1.96,
      AQ: 1.96,
      AK: 1.96,
      BA: 1.96,
      B2: 1.96,
      B3: 1.96,
      B4: 1.96,
      B5: 1.96,
      B6: 1.96,
      B7: 1.96,
      B8: 1.96,
      B9: 1.96,
      B10: 1.96,
      BJ: 1.96,
      BQ: 1.96,
      BK: 1.96,
    },
    bettingDuration: 20000,
    cardDealInterval: 3000,
  },

  [GAME_TYPES.DRAGON_TIGER_LION]: {
    id: "DTL20",
    name: "Dragon Tiger Lion 20-20",
    betSides: [
      "dragon",
      "tiger",
      "lion",
      "DR",
      "DB",
      "DE",
      "DO",
      "TR",
      "TB",
      "TE",
      "TO",
      "LR",
      "LB",
      "LE",
      "LO",
    ],
    multipliers: {
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
    },
    bettingDuration: 20000,
    cardDealInterval: 3000,
  },
};

export function initializeGameProperties(gameType) {
  const config = GAME_CONFIGS[gameType];
  if (!config) throw new Error(`Invalid game type: ${gameType}`);

// betSides -> game_bet_sides | list of game_bet_sides.bet_side where game_id
// multipliers -> game_bet_sides | list of game_bet_sides.multiplier where game_id
// bettingDuration -> games | games.betting_duration where game_id
// cardDealInterval ->  games | games.card_deal_interval where game_id

  return {
    betSides: config.betSides,
    bettingDuration: config.bettingDuration,
    cardDealInterval: config.cardDealInterval,
    multipliers: config.multipliers,
  };
}
