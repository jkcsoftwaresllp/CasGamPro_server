import { addStake } from "../../store/stakeStore.js";

export const setBet = async (req, res) => {
  const { spectators, player, amount } = req.body;
  try {
    addStake({ spectators, player, amount });
    res.status(201).json({ message: "Bet placed successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to place bet." });
  }
};