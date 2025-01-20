import { generateGameId } from "../helper/startGameHelper.js";
import { createGame } from "../../store/gameStore.js";
import { clearStakes } from "../../store/stakeStore.js";
import { logger } from "../../logger/logger.js";

export const startGame = async (req, res) => {
  try {
    const gameId = generateGameId();
    createGame(gameId);
    clearStakes();
    res.status(201).json({ message: "Game started successfully.", gameId });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: "Failed to initiate game." });
  }
};
