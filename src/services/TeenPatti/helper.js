export function generateTrail(deck) {
  const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
  const suits = ["S", "H", "C", "D"];

  // Randomly pick 3 suits from the 4 available suits
  const selectedSuits = [];
  while (selectedSuits.length < 3) {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    if (!selectedSuits.includes(suit)) {
      selectedSuits.push(suit);
    }
  }

  // Pick a random rank
  const rank = ranks[Math.floor(Math.random() * ranks.length)];

  // Return 3 cards, one from each of the selected suits
  return selectedSuits.map(suit => `${suit}${rank}`);
}

export function generatePureSequence(deck) {
  const sequences = [
    ["A", "2", "3"],
    ["2", "3", "4"],
    ["3", "4", "5"],
    ["4", "5", "6"],
    ["5", "6", "7"],
    ["6", "7", "8"],
    ["7", "8", "9"],
    ["8", "9", "10"],
    ["9", "10", "J"],
    ["10", "J", "Q"],
    ["J", "Q", "K"],
    ["Q", "K", "A"]
  ];

  const randomSequence = sequences[Math.floor(Math.random() * sequences.length)];
  const suit = ["S", "H", "C", "D"][Math.floor(Math.random() * 4)];

  return randomSequence.map(rank => `${suit}${rank}`);
}

export function generateSequence(deck) {
  // Similar to pure sequence but with mixed suits
  const sequence = generatePureSequence(deck);
  const suits = ["S", "H", "C", "D"];

  return sequence.map(card => {
    const rank = card.slice(1);
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    return `${randomSuit}${rank}`;
  });
}

export function generateColor(deck) {
  const suits = ["S", "H", "C", "D"];
  const suit = suits[Math.floor(Math.random() * 4)];
  const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
  const selectedRanks = [];
  while (selectedRanks.length < 3) {
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    if (!selectedRanks.includes(rank)) {
      selectedRanks.push(rank);
    }
  }
  return selectedRanks.map(rank => `${suit}${rank}`);
}

export function generatePair(availableCards) {
  const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
  const suits = ["S", "H", "C", "D"];

  // Pick a random rank for the pair
  const pairRank = ranks[Math.floor(Math.random() * ranks.length)];

  // Generate two cards of the same rank
  const pairCards = suits.slice(0, 2).map(suit => `${suit}${pairRank}`);

  // Add a random kicker card
  const kickerRank = ranks.filter(r => r !== pairRank)[Math.floor(Math.random() * (ranks.length - 1))];
  const kickerSuit = suits[Math.floor(Math.random() * suits.length)];

  return [...pairCards, `${kickerSuit}${kickerRank}`];
}

export function generateHighCard(availableCards) {
  // Just pick three random cards that don't form any of the above combinations
  const hand = [];
  const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
  const suits = ["S", "H", "C", "D"];

  while (hand.length < 3) {
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const card = `${suit}${rank}`;

    if (!hand.includes(card)) {
      hand.push(card);
    }
  }

  return hand;
}
