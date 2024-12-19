const express = require('express');
const app = express();
const port = 3000;

// Shared state to store game data
let gameState = {
  gameId: null,
  cardMap: {},
  cardKeys: [],
  stack: [], // Stack of cards for gameplay
  jokerCard: null, // Joker card rank
  bets: { Andar: 0, Bahar: 0 }, // Track bets for Andar and Bahar
  winnerSide: null, // Winning side
};

// Generate a unique gameId
function generateGameId() {
  return `game_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

// Generate a shuffled deck as card codes
function generateCardDeck() {
  const suits = ['D', 'S', 'C', 'H']; // Diamonds, Spades, Clubs, Hearts
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  let cardCodes = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      cardCodes.push(`${suit}${rank}`);
    }
  }
  return cardCodes;
}

// API: Start the Game
app.get('/api/g2/startGame', (req, res) => {
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

  cardDeck.forEach(card => {
    const randomString = Math.random().toString(36).substring(2, 10); // Generate random string
    gameState.cardMap[randomString] = card;
    gameState.cardKeys.push(randomString);
  });

  console.log(`Game ID: ${gameId}`);
  res.json({ gameId });
});

// API: Place Bet
app.post('/api/g2/placeBet', (req, res) => {
  const { side, amount } = req.query;
  if (!['Andar', 'Bahar'].includes(side) || !amount) {
    return res.status(400).json({ error: 'Invalid side or amount' });
  }
  gameState.bets[side] += parseInt(amount, 10);
  res.json({ message: 'Bet placed successfully' });
});

// API: Reveal Joker Card
app.get('/api/g2/showJokerCard', (req, res) => {
  if (!gameState.cardKeys.length) {
    return res.status(400).json({ error: 'Game not started' });
  }

  const jokerIndex = Math.floor(Math.random() * gameState.cardKeys.length);
  const jokerCardHash = gameState.cardKeys[jokerIndex];
  const jokerCard = gameState.cardMap[jokerCardHash];
  gameState.jokerCard = jokerCard.slice(1); // Store only the rank (e.g., '8')

  console.log('Joker Card:', jokerCard);
  res.json({ jokerCard });
});

// API: Arrange Stack
app.get('/api/g2/arrangeStack', (req, res) => {
  if (!gameState.jokerCard) {
    return res.status(400).json({ error: 'Joker card not revealed yet' });
  }

  const { Andar, Bahar } = gameState.bets;
  gameState.winnerSide = Andar > Bahar ? 'Bahar' : Andar < Bahar ? 'Andar' : Math.random() > 0.5 ? 'Andar' : 'Bahar';

  const jokerCardRank = gameState.jokerCard;
  const nonJokerCards = gameState.cardKeys.filter(
    key => !gameState.cardMap[key].endsWith(jokerCardRank)
  );

  // Build stack with the joker card at the end
  const jokerCardHash = gameState.cardKeys.find(key => gameState.cardMap[key].endsWith(jokerCardRank));
  if (!jokerCardHash) {
    return res.status(500).json({ error: 'Joker card not found in deck' });
  }

  const randomCardCount = Math.max(3, Math.floor(Math.random() * 40) + 3); // Random length >= 3
  const isEven = gameState.winnerSide === 'Bahar';

  let stack = [];
  let addedCards = 0;
  while (addedCards < randomCardCount - 1 && nonJokerCards.length > 0) {
    const cardIndex = Math.floor(Math.random() * nonJokerCards.length);
    const selectedCard = nonJokerCards.splice(cardIndex, 1)[0];

    // Avoid duplicate ranks of the joker card
    if (!gameState.cardMap[selectedCard].endsWith(jokerCardRank)) {
      stack.push(selectedCard);
      addedCards++;
    }
  }

  // Ensure the total cards added align with the even/odd requirement
  if ((addedCards % 2 === 0) !== isEven) {
    stack.pop();
    addedCards--;
  }

  // Add the joker card as the last card in the stack
  stack.push(jokerCardHash);

  gameState.stack = stack;

  console.log('Final Stack:', gameState.stack.map(hash => gameState.cardMap[hash]));
  res.json({ stackLength: gameState.stack.length });
});

// API: Fetch Next Card
app.get('/api/g2/nextCard', (req, res) => {
  if (!gameState.stack || gameState.stack.length === 0) {
    return res.status(400).json({ error: 'Stack is empty. Restart the game.' });
  }

  const nextCardHash = gameState.stack.shift();
  const nextCard = gameState.cardMap[nextCardHash];
  console.log(`Next Card: ${nextCard} (Hash: ${nextCardHash})`);
  res.json({ nextCardHash });
});

// Start the server
app.listen(port, () => {
  console.log(`Game server running on http://localhost:${port}`);
});
