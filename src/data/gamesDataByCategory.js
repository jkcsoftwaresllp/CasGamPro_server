import { GAME_TYPES, GAME_CONFIGS } from "../services/shared/config/types.js";

export const getGameId = (gameType) => {
  const result = GAME_CONFIGS[gameType].id;
  return result;
};

// gamesData
export const gamesDataByCategory = [
  {
    name: "TeenPatti T-20",
    gameType: GAME_TYPES.TEEN_PATTI,
    gameId: getGameId(GAME_TYPES.TEEN_PATTI),
    description: "Fast-paced card game",
    categoryId: 1,
    thumbnail: "url_of_thumbnail",

    bettingDuration: 30000,
    cardDealInterval: 3000,
  },
  {
    name: "Andar Bahar 2",
    gameType: GAME_TYPES.ANDAR_BAHAR_TWO,
    gameId: getGameId(GAME_TYPES.ANDAR_BAHAR_TWO),
    description: "Classic Andar Bahar game",
    categoryId: 1,
    thumbnail: "url_of_thumbnail",
    bettingDuration: 25000,
    cardDealInterval: 3000,
  },
  {
    name: "Lucky 7-B",
    gameType: GAME_TYPES.LUCKY7B,
    gameId: getGameId(GAME_TYPES.LUCKY7B),
    description: "Luck-based dice game",
    categoryId: 1,
    thumbnail: "url_of_thumbnail",
    bettingDuration: 20000,
    cardDealInterval: 3000,
  },
  {
    name: "Lucky 7-A",
    gameType: GAME_TYPES.LUCKY7A,
    gameId: getGameId(GAME_TYPES.LUCKY7A),
    description: "Luck-based dice game",
    categoryId: 1,
    thumbnail: "url_of_thumbnail",
  },
  {
    name: "20-20 Dragon Tiger",
    gameType: GAME_TYPES.DRAGON_TIGER,
    gameId: getGameId(GAME_TYPES.DRAGON_TIGER),
    description: "Dragon Tiger game",
    categoryId: 1,
    thumbnail: "url_of_thumbnail",
    bettingDuration: 20000,
    cardDealInterval: 3000,
  },
  {
    name: "20-20 Dragon Tiger Two",
    gameType: GAME_TYPES.DRAGON_TIGER_TWO,
    gameId: getGameId(GAME_TYPES.DRAGON_TIGER_TWO),
    description: "Dragon Tiger Two game",
    categoryId: 1,
    thumbnail: "url_of_thumbnail",
  },
  {
    name: "Andar Bahar",
    gameType: GAME_TYPES.ANDAR_BAHAR,
    gameId: getGameId(GAME_TYPES.ANDAR_BAHAR),
    description: "Classic Andar Bahar game",
    categoryId: 1,
    thumbnail: "url_of_thumbnail",
    bettingDuration: 20000,
    cardDealInterval: 3000,
  },
  // {
  //   name: "TeenPatti T1-Day",
  //   gameType: GAME_TYPES.TEEN_PATTI,
  //   gameId: getGameId(GAME_TYPES.ANDAR_BAHAR),
  //   description: "Day version of TeenPatti T-20",
  //   categoryId: 1,
  //   thumbnail: "url_of_thumbnail",
  // },
  {
    name: "20-20 D T L",
    gameType: GAME_TYPES.DRAGON_TIGER_LION,
    gameId: getGameId(GAME_TYPES.ANDAR_BAHAR),
    description: "Dragon Tiger Luck game",
    categoryId: 1,
    thumbnail: "url_of_thumbnail",

    bettingDuration: 20000,
    cardDealInterval: 3000,
  },
];
