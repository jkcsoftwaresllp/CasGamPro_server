import { logger } from "../../logger/logger.js";
import { getGame } from "../../store/gameStore.js";

export const getResult = async (req, res) => {
  const { gameId } = req.query;
  try {
    const game = getGame(gameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found." });
    }
    res.status(200).json({ winner: game.result });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: "Failed to retrieve result." });
  }
};
