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
    multipiers: { andar: 1.95, bahar: 1.95 },
    dealingDuration: 5000,
    bettingDuration: 20000,
    bettingDuration: 20000,
    joker: true,
    blind: true,
  },

  {
    // 1
    id: "L7B",
    type: GAME_TYPES.LUCKY7B,
    name: "Lucky 7B",
    betOptions: ["low", "high", "mid", "even", "odd", "black", "red"],
    multipliers: {
      low: 1.8,
      high: 1.8,
      mid: 8,
      even: 1.8,
      odd: 1.8,
      black: 1.8,
      red: 1.8,
    },
    dealingDuration: 3000,
    bettingDuration: 20000,
    cardDealInterval: 500,
    joker: false,
    blind: true,
  },
  {
    // 2
    id: "TP1",
    type: GAME_TYPES.TEEN_PATTI,
    name: "Teen Patti T20",
    betOptions: ["playerA", "playerB"],
    multipliers: { default: 1.9 },
    dealingDuration: 5000,
    bettingDuration: 30000,
    cardDealInterval: 1000,
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
      "odd",
      "even",
      "black",
      "red",
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
    ],
    multipliers: {
      dragon: 1.98,
      tiger: 1.98,
      tie: 11,
      pair: 12,
      odd: 1.8,
      even: 1.8,
      black: 1.8,
      red: 1.8,
      D2: 8,
      D3: 8,
      DA: 8,
      D4: 8,
      D5: 8,
      D6: 8,
      D7: 8,
      D8: 8,
      D9: 8,
      D10: 8,
      DJ: 8,
      DQ: 8,
      DK: 8,
      TA: 8,
      T2: 8,
      T3: 8,
      T4: 8,
      T5: 8,
      T6: 8,
      T7: 8,
      T8: 8,
      T9: 8,
      T10: 8,
      TJ: 8,
      TQ: 8,
      TK: 8,
    },
    dealingDuration: 3000,
    bettingDuration: 20000,
    cardDealInterval: 500,
    blind: true,
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
      A2: 1.95,
      A3: 1.95,
      AA: 1.95,
      A4: 1.95,
      A5: 1.95,
      A6: 1.95,
      A7: 1.95,
      A8: 1.95,
      A9: 1.95,
      A10: 1.95,
      AJ: 1.95,
      AQ: 1.95,
      AK: 1.95,
      BA: 1.95,
      B2: 1.95,
      B3: 1.95,
      B4: 1.95,
      B5: 1.95,
      B6: 1.95,
      B7: 1.95,
      B8: 1.95,
      B9: 1.95,
      B10: 1.95,
      BJ: 1.95,
      BQ: 1.95,
      BK: 1.95,
    },
    dealingDuration: 5000,
    bettingDuration: 20000,
    cardDealInterval: 1000,
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
      dragon: 1.98,
      tiger: 1.98,
      lion: 1.98,
      DR: 1.8,
      DB: 1.8,
      DE: 1.8,
      DO: 1.8,
      TR: 1.8,
      TB: 1.8,
      TE: 1.8,
      TO: 1.8,
      LR: 1.8,
      LB: 1.8,
      LE: 1.8,
      LO: 1.8,
    },
    dealingDuration: 5000,
    bettingDuration: 20000,
    cardDealInterval: 500,
    joker: false,
    blind: true,
  },
];
