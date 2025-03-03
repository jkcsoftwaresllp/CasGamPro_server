const HAND_RANK = {
  1: generateTrail,
  2: generatePureSequence,
  3: generateSequence,
  4: generateColor,
  5: generatePair,
  6: generateHighCard,
};

export function generateWinningHand(deck) {
  // This is to add randomness to the Hands
  const handTypes = {
    1: 6,
    2: 1,
    3: 6,
    4: 5,
    5: 2,
    6: 6,
    7: 4,
    8: 3,
    9: 6,
    10: 4,
    11: 6,
    12: 4,
    13: 6,
    14: 5,
  };

  const randomIndex =
    Math.floor(Math.random() * Object.keys(handTypes).length) + 1;

  const randomHandType = handTypes[randomIndex];
  const winningHandGenerator = HAND_RANK[randomHandType];

  return {
    winningHand: winningHandGenerator(deck),
    winningHandRank: randomHandType,
  };
}

export function generateLosingHand(deck, winningHand, handRank) {
  // Remove used cards from the deck to avoid duplication
  const usedCards = new Set(winningHand);
  const availableCards = deck.filter((card) => !usedCards.has(card));

  // Card values based on rank
  const cardValues = {
    A: 14,
    K: 13,
    Q: 12,
    J: 11,
    10: 10,
    9: 9,
    8: 8,
    7: 7,
    6: 6,
    5: 5,
    4: 4,
    3: 3,
    2: 2,
  };

  if (handRank === 6) {
    // Function to calculate the sum of a hand
    const calculateHandSum = (hand) =>
      hand.reduce((sum, card) => sum + cardValues[card.slice(1)], 0);

    let losingHand, losingSum, winningSum;

    winningSum = calculateHandSum(winningHand);

    do {
      losingHand = generateHighCard(availableCards);
      losingSum = calculateHandSum(losingHand);
    } while (losingSum === winningSum); // Ensure different sum

    // Determine winning and losing hand based on sum
    if (winningSum > losingSum) {
      return { winningHand, losingHand };
    } else {
      return { winningHand: losingHand, losingHand: winningHand };
    }
  }

  const possibleRanks = Object.keys(HAND_RANK)
    .map(Number)
    .filter((rank) => rank > handRank);

  if (possibleRanks.length === 0) {
    throw new Error("No valid losing hand ranks available.");
  }

  // Select a random rank from the possible lower ranks
  const losingHandRank =
    possibleRanks[Math.floor(Math.random() * possibleRanks.length)];
  const losingHandGenerator = HAND_RANK[losingHandRank];

  return {
    losingHand: losingHandGenerator(availableCards),
    winningHand,
  };
}

export function generateTrail(deck) {
  const ranks = [
    "A",
    "K",
    "Q",
    "J",
    "10",
    "9",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
  ];
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
  return selectedSuits.map((suit) => `${suit}${rank}`);
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
    ["Q", "K", "A"],
  ];

  const randomSequence =
    sequences[Math.floor(Math.random() * sequences.length)];
  const suit = ["S", "H", "C", "D"][Math.floor(Math.random() * 4)];

  return randomSequence.map((rank) => `${suit}${rank}`);
}

export function generateSequence(deck) {
  // Similar to pure sequence but with mixed suits
  const sequence = generatePureSequence(deck);
  const suits = ["S", "H", "C", "D"];

  return sequence.map((card) => {
    const rank = card.slice(1);
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    return `${randomSuit}${rank}`;
  });
}

export function generateColor(deck) {
  const suits = ["S", "H", "C", "D"];
  const suit = suits[Math.floor(Math.random() * 4)];
  const ranks = [
    "A",
    "K",
    "Q",
    "J",
    "10",
    "9",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
  ];
  const selectedRanks = [];
  while (selectedRanks.length < 3) {
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    if (!selectedRanks.includes(rank)) {
      selectedRanks.push(rank);
    }
  }
  return selectedRanks.map((rank) => `${suit}${rank}`);
}

export function generatePair(availableCards) {
  const ranks = [
    "A",
    "K",
    "Q",
    "J",
    "10",
    "9",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
  ];
  const suits = ["S", "H", "C", "D"];

  // Pick a random rank for the pair
  const pairRank = ranks[Math.floor(Math.random() * ranks.length)];

  // Generate two cards of the same rank
  const pairCards = suits.slice(0, 2).map((suit) => `${suit}${pairRank}`);

  // Add a random kicker card
  const kickerRank = ranks.filter((r) => r !== pairRank)[
    Math.floor(Math.random() * (ranks.length - 1))
  ];
  const kickerSuit = suits[Math.floor(Math.random() * suits.length)];

  return [...pairCards, `${kickerSuit}${kickerRank}`];
}

export function generateHighCard(availableCards) {
  // Just pick three random cards that don't form any of the above combinations
  const hand = [];
  const ranks = [
    "A",
    "K",
    "Q",
    "J",
    "10",
    "9",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
  ];
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
