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

export function generateWinnerHand(deck, side, bets) {
  const suits = ["S", "H", "C", "D"];
  const betCategories = {
    black: ['S', 'C'], 
    red: ['H', 'D'], 
    odd: ['A', '3', '5', '7', '9', 'J', 'K'], 
    even: ['2', '4', '6', '8', '10', 'Q'] 
  };

  let leastBetCategory = Object.keys(betCategories).reduce((a, b) => {
    console.log("w", bets)
    console.log("d", a, b)
    return bets[a] < bets[b] ? a : b;
  });

  let selectedSuits = betCategories[leastBetCategory];

  const ranks = leastBetCategory === 'odd' ? ['A', '3', '5', '7', '9', 'J', 'K'] : ['2', '4', '6', '8', '10', 'Q'];

  const suit = selectedSuits[Math.floor(Math.random() * selectedSuits.length)];
  const rank = ranks[Math.floor(Math.random() * ranks.length)];

  return `${suit}${rank}`;
}

export function generateLosingHand(deck, winningHand) {
  const usedCards = new Set(winningHand);
  const availableCards = deck.filter(card => !usedCards.has(card));

  const winningCardRank = winningHand[1]; 
  const lowerRankedCards = availableCards.filter(card => {
    const rankOrder = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
    const cardRank = card[1];
    return rankOrder.indexOf(cardRank) < rankOrder.indexOf(winningCardRank);
  });

  const hand = [];
  const randomCard = lowerRankedCards[Math.floor(Math.random() * lowerRankedCards.length)];
  hand.push(randomCard);
  return hand;
}
