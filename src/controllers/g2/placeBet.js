// API: Place Bet
export const placeBet = (req, res) => {
  const { side, amount } = req.query;
  if (!["Andar", "Bahar"].includes(side) || !amount) {
    return res.status(400).json({ error: "Invalid side or amount" });
  }
  gameState.bets[side] += parseInt(amount, 10);
  res.json({ message: "Bet placed successfully" });
};
