// API: Fetch Next Card
export const nextCard = (req, res) => {
  if (!gameState.stack || gameState.stack.length === 0) {
    return res.status(400).json({ error: "Stack is empty. Restart the game." });
  }

  const nextCardHash = gameState.stack.shift();
  const nextCard = gameState.cardMap[nextCardHash];
  console.log(`Next Card: ${nextCard} (Hash: ${nextCardHash})`);
  res.json({ nextCardHash });
};
