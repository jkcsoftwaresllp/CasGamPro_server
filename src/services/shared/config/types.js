// noinspection SpellCheckingInspection

export const GAME_TYPES = {
    ANDAR_BAHAR_TWO: 'ANDAR_BAHAR_TWO',
    LUCKY7B: 'LUCKY7B',
    TEEN_PATTI: 'TEEN_PATTI',
    DRAGON_TIGER: 'DRAGON_TIGER',
    ANDAR_BAHAR: 'ANDAR_BAHAR'
};

export const GAME_STATES = {
    WAITING: 'waiting',
    BETTING: 'betting',
    DEALING: 'dealing',
    COMPLETED: 'completed'
};

export const GAME_CONFIGS = [
    {
        id: "AB2",
        type: GAME_TYPES.ANDAR_BAHAR_TWO,
        name: "Andar Bahar 2",
        betOptions: ["andar", "bahar"],
    },

    {
        id: "L7B",
        type: GAME_TYPES.LUCKY7B,
        name: "Lucky 7B",
        betOptions: ["low", "high", "mid", "even", "odd", "black", "red"],
    },
    {
        id: "TP1",
        type: GAME_TYPES.TEEN_PATTI,
        name: "Teen Patti T20",
        betOptions: ["player a", "player b"],
    },
    {
        id: "DT20", 
        type: GAME_TYPES.DRAGON_TIGER,
        name: "Dragon Tiger 20-20",
        betSides: ["dragon", "tiger", "tie", "pair", "odd", "even", "black", "red", "specificCard"], 
    },
    {
        id: "AB1",
        type: GAME_TYPES.ANDAR_BAHAR,
        name: "Andar Bahar 1",
        betOptions: ["andar", "bahar"],
    },

    // add new game service here...
];
