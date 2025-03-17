import { GAME_TYPES, GAME_CONFIGS } from "../services/shared/config/types.js";

const DEFAULT_THUMBNAIL = "url_of_thumbnail";
const DEFAULT_DESCRIPTION = "This is a casino game.";

const getGameData = (gameType) => {
  const {
    name,
    id: gameId,
    bettingDuration,
    cardDealInterval,
    description,
  } = GAME_CONFIGS[gameType] || {};
  return {
    name,
    gameType,
    gameId,
    bettingDuration,
    cardDealInterval,
    description: description || DEFAULT_DESCRIPTION,
    thumbnail: DEFAULT_THUMBNAIL,
  };
};

const categoryId = 1;

export const casinoGamesData = [
  getGameData(GAME_TYPES.TEEN_PATTI),
  getGameData(GAME_TYPES.ANDAR_BAHAR_TWO),
  getGameData(GAME_TYPES.LUCKY7B),
  getGameData(GAME_TYPES.LUCKY7A),
  getGameData(GAME_TYPES.DRAGON_TIGER),
  getGameData(GAME_TYPES.DRAGON_TIGER_TWO),
  getGameData(GAME_TYPES.ANDAR_BAHAR),
  getGameData(GAME_TYPES.DRAGON_TIGER_LION),
].map((game) => ({
  ...game,
  categoryId,
}));
