import { logger } from "../../logger/logger.js";
import { getStakes as getStakesFromStore } from "../../store/stakeStore.js";

export const getStakes = async (req, res) => {
  try {
    const stakes = getStakesFromStore();
    res.status(200).json(stakes);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: "Failed to fetch stakes." });
  }
};
