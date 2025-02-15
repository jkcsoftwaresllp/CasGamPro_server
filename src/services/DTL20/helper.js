export function generateCard(deck, suit) {
  const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
  const rank = ranks[Math.floor(Math.random() * ranks.length)];
  return `${suit}${rank}`;
}

export function generateHand(deck, suits) {
  const hand = [];
  for (let suit of suits) {
    hand.push(generateCard(deck, suit));
  }
  return hand;
}

export function generateWinnerHand(deck, side, bets = {}) {
  const suits = ["S", "H", "C", "D"];

  // Initialize bet amounts for each category
  const betAmounts = {
    black: 0,
    red: 0,
    odd: 0,
    even: 0
  };

  // Calculate total bets for each category from the bets map
  for (const [userId, userBets] of Object.entries(bets)) {
    userBets.forEach(bet => {
      if (bet.side === 'black') betAmounts.black += bet.amount;
      if (bet.side === 'red') betAmounts.red += bet.amount;
      if (bet.side === 'odd') betAmounts.odd += bet.amount;
      if (bet.side === 'even') betAmounts.even += bet.amount;
    });
  }

  const betCategories = {
    black: ['S', 'C'],
    red: ['H', 'D'],
    odd: ['A', '3', '5', '7', '9', 'J', 'K'],
    even: ['2', '4', '6', '8', '10', 'Q']
  };

  // Find category with least bets
  let leastBetCategory = Object.keys(betAmounts).reduce((a, b) =>
    betAmounts[a] < betAmounts[b] ? a : b
  );

  let selectedSuits = betCategories[leastBetCategory];

  // Determine ranks based on least bet category
  const ranks = leastBetCategory === 'odd'
    ? ['A', '3', '5', '7', '9', 'J', 'K']
    : ['2', '4', '6', '8', '10', 'Q'];

  const suit = selectedSuits[Math.floor(Math.random() * selectedSuits.length)];
  const rank = ranks[Math.floor(Math.random() * ranks.length)];

  return `${suit}${rank}`;
}

// export function generateLosingHand(deck, winningHand) {
//   const usedCards = new Set([winningHand]);
//   const availableCards = deck.filter(card => !usedCards.has(card));

//   const winningCardRank = winningHand[1];
//   const rankOrder = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

//   const lowerRankedCards = availableCards.filter(card => {
//     const cardRank = card.slice(1); // Handle multi-character ranks like "10"
//     return rankOrder.indexOf(cardRank) > rankOrder.indexOf(winningCardRank);
//   });

//   if (lowerRankedCards.length === 0) {
//     // If no lower ranked cards available, just pick a random different card
//     const differentCards = availableCards.filter(card => card !== winningHand);
//     return [differentCards[Math.floor(Math.random() * differentCards.length)]];
//   }

//   return [lowerRankedCards[Math.floor(Math.random() * lowerRankedCards.length)]];
// }

export function generateLosingHand(deck, winningHand) {
  const suits = ["S", "H", "C", "D"];
  const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

  const winningCardRank = winningHand.slice(1);
  const winningCardSuit = winningHand[0];

  // Generate a losing card that's different from the winning card
  let losingCard;
  do {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const rankIndex = Math.floor(Math.random() * ranks.length);
    losingCard = `${suit}${ranks[rankIndex]}`;
  } while (losingCard === winningHand);

  return [losingCard];
}
