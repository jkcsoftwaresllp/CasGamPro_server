// noinspection SpellCheckingInspection

export const GAME_TYPES = {
    ANDAR_BAHAR: 'ANDAR_BAHAR',
    TEEN_PATTI: 'TEEN_PATTI',
    DRAGON_TIGER: 'DRAGON_TIGER'
};

export const GAME_STATES = {
    WAITING: 'waiting',
    BETTING: 'betting',
    DEALING: 'dealing',
    COMPLETED: 'completed'
};

export const GAME_CONFIGS = [
    {
        id: "AB1",
        type: GAME_TYPES.ANDAR_BAHAR,
        name: "Andar Bahar 1",
        multiplier: 1.95,
    },

    // add new game service here...
];