import { gameConfigData } from "../data/gameConfigData.js";

// Function to get game name from gameConfigData
export const getGameName = (gameTypeId) => {
  const game = gameConfigData.find((g) => g.gameTypeId === gameTypeId);
  return game ? game.name : "Unknown Game";
};
