// API: Start the Game
export const startGame = (req, res) => {
  const gameId = generateGameId();

  // Initialize game state
  const cardDeck = generateCardDeck();
  gameState = {
    gameId,
    cardMap: {},
    cardKeys: [],
    stack: [],
    jokerCard: null,
    bets: { Andar: 0, Bahar: 0 },
    winnerSide: null,
  };

  cardDeck.forEach((card) => {
    const randomString = Math.random().toString(36).substring(2, 10); // Generate random string
    gameState.cardMap[randomString] = card;
    gameState.cardKeys.push(randomString);
  });

  console.log(`Game ID: ${gameId}`);
  res.json({ gameId });
};
