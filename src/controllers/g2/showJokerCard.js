// API: Reveal Joker Card
export const showJockerCard = (req, res) => {
  if (!gameState.cardKeys.length) {
    return res.status(400).json({ error: "Game not started" });
  }

  const jokerIndex = Math.floor(Math.random() * gameState.cardKeys.length);
  const jokerCardHash = gameState.cardKeys[jokerIndex];
  const jokerCard = gameState.cardMap[jokerCardHash];
  gameState.jokerCard = jokerCard.slice(1); // Store only the rank (e.g., '8')

  console.log("Joker Card:", jokerCard);
  res.json({ jokerCard });
};
