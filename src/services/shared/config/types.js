// noinspection SpellCheckingInspection

export const GAME_TYPES = {
  ANDAR_BAHAR_TWO: "ANDAR_BAHAR_TWO",
  LUCKY7B: "LUCKY7B",
  TEEN_PATTI: "TEEN_PATTI",
  DRAGON_TIGER: "DRAGON_TIGER",
  ANDAR_BAHAR: "ANDAR_BAHAR",
  DRAGON_TIGER_LION: "DRAGON_TIGER_LION",
};

export const GAME_STATES = {
  WAITING: "waiting",
  BETTING: "betting",
  DEALING: "dealing",
  COMPLETED: "completed",
};

export const GAME_CONFIGS = [
  {
    // 0
    id: "AB2",
    type: GAME_TYPES.ANDAR_BAHAR_TWO,
    name: "Andar Bahar 2",
    betOptions: ["andar", "bahar"],
    multipiers: { andar: 1.96, bahar: 1.96 },
    dealingDuration: 3000,
    bettingDuration: 25000,
    cardDealInterval: 3000,
    joker: true,
    blind: true,
  },

  {
    // 1
    id: "L7B",
    type: GAME_TYPES.LUCKY7B,
    name: "Lucky 7B",
    betOptions: [
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
      A: 9,
      2: 9,
      3: 9,
      4: 9,
      5: 9,
      6: 9,
      7: 9,
      8: 9,
      9: 9,
      10: 9,
      J: 9,
      Q: 9,
      K: 9,
    },
    dealingDuration: 3000,
    bettingDuration: 20000,
    cardDealInterval: 3000,
    joker: false,
    blind: true,
  },
  {
    // 2
    id: "TP1",
    type: GAME_TYPES.TEEN_PATTI,
    name: "Teen Patti T20",
    betOptions: ["playerA", "playerB"],
    multipliers: { playerA: 1.96, playerB: 1.96 },
    dealingDuration: 5000,
    bettingDuration: 30000,
    cardDealInterval: 3000,
    cardsPerPlayer: 3,
    joker: false,
    blind: true,
  },
  {
    // 3
    id: "DT20",
    type: GAME_TYPES.DRAGON_TIGER,
    name: "Dragon Tiger 20-20",
    betOptions: [
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
    },
    dealingDuration: 3000,
    bettingDuration: 20000,
    cardDealInterval: 3000,
    blind: true,
    joker: false,
  },
  {
    // 4
    id: "AB1",
    type: GAME_TYPES.ANDAR_BAHAR,
    name: "Andar Bahar 1",
    betOptions: [
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
    dealingDuration: 5000,
    bettingDuration: 20000,
    cardDealInterval: 3000,
    joker: true,
    blind: true,
  },
  {
    // 5
    id: "DTL20",
    type: GAME_TYPES.DRAGON_TIGER_LION,
    name: "Dragon Tiger Lion 20-20",
    betOptions: [
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
      DR: 1.97,
      DB: 1.97,
      DE: 2.42,
      DO: 1.83,
      TR: 1.97,
      TB: 2.9,
      TE: 2.42,
      TO: 1.83,
      LR: 1.97,
      LB: 2.9,
      LE: 2.42,
      LO: 1.83,
    },
    dealingDuration: 3000,
    bettingDuration: 20000,
    cardDealInterval: 3000,
    joker: false,
    blind: true,
  },
];
