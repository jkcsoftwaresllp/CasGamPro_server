export function findLeastBetSide(bets) {
  const categories = {
    A: ["AA", "BA"],
    2: ["A2", "B2"],
    3: ["A3", "B3"],
    4: ["A4", "B4"],
    5: ["A5", "B5"],
    6: ["A6", "B6"],
    7: ["A7", "B7"],
    8: ["A8", "B8"],
    9: ["A9", "B9"],
    10: ["A10", "B10"],
    J: ["AJ", "BJ"],
    Q: ["AQ", "BQ"],
    K: ["AK", "BK"],
  };

  const leastBetSides = {};

  for (const key in categories) {
    const [sideA, sideB] = categories[key];

    const betA = parseFloat(bets[sideA]) || 0;
    const betB = parseFloat(bets[sideB]) || 0;

    // Determine which side has the minimum bet
    leastBetSides[key] =
      betA === betB
        ? Math.random() < 0.5
          ? "A"
          : "B"
        : betA < betB
        ? "A"
        : "B";
  }
  return leastBetSides;
}

function shuffleDeck(suits, cardRanks) {
  const deck = [];

  suits.forEach((suit) => {
    cardRanks.forEach((rank) => {
      deck.push(`${suit}${rank}`);
    });
  });

  return deck.sort(() => Math.random() - 0.5);
}

function randomiseArrayFromNtoM(inputArr, outputSize, fillValue = 0) {
  if (outputSize < inputArr.length) {
    throw new Error(
      "Output size must be greater than or equal to input array length."
    );
  }

  let outputArr = new Array(outputSize).fill(fillValue);
  let indices = [...Array(outputSize).keys()]; // Create an array of indices
  indices = indices.sort(() => Math.random() - 0.5);

  let insertedPositions = new Set(indices); // Track positions where 1s are inserted

  // Place input array elements at random positions
  for (let i = 0; i < inputArr.length; i++) {
    outputArr[indices[i]] = inputArr[i];
    insertedPositions.delete(indices[i]);
  }

  return {
    outputArr,
    fillPositions: [...insertedPositions],
  };
}

function isEqualOrDiffByOne(a, b) {
  return Math.abs(a - b) <= 1;
}

function generateRandomSalt() {
  const values = [-1, 0, 1];
  return values[Math.floor(Math.random() * values.length)];
}

function replaceFillWithCard(fillArr, comparingArr, fillPositionArr, cardsArr) {
  let usedCards = new Set(); // Track used cards to avoid duplicate usage
  let seenRanks = new Set(); // Track ranks seen up to a position
  let seenRanksForFillArr = new Set(); // Track ranks seen up to a position

  seenRanks.clear();

  for (let i = 0; i < fillArr.length; i++) {
    if (!fillPositionArr.includes(i)) {
      seenRanksForFillArr.add(fillArr[i].slice(1));
    }
  }

  const resetSeenRank = () => {
    seenRanks.clear();
    for (let rank of seenRanksForFillArr) {
      seenRanks.add(rank);
    }
  };

  for (let pos of fillPositionArr) {
    // Gather ranks that appeared before this position
    resetSeenRank();

    for (let i = 0; i < pos; i++) {
      seenRanks.add(comparingArr[i].slice(1));
    }

    // Find a valid replacement card
    let found = false;
    for (let card of cardsArr) {
      let rank = card.slice(1);
      if (!usedCards.has(card) && seenRanks.has(rank)) {
        fillArr[pos] = card;
        usedCards.add(card);
        found = true;
        break;
      }
    }

    // If no valid card is found, keep the placeholder (1)
    if (!found) {
      console.warn(`No valid replacement found for position ${pos}`);
    }
  }

  return fillArr;
}

/**
 * handleCardDistribution - Distributes cards fairly between two sides (A & B)
 *
 * Approach:
 * 1. **Initialize Deck**: Create and shuffle a standard deck of 52 cards.
 * 2. **Ensure Rank Appearance**: Distribute at least one card of each rank (A, 2, 3, ... K)
 *    to one of the sides based on `leastBetSide`.
 * 3. **Balance the Distribution**:
 *    - If both sides have nearly equal cards, return as is.
 *    - Otherwise, adjust the smaller side by randomly adding more cards.
 * 4. **Fill Missing Positions**:
 *    - Identify positions where extra cards are needed.
 *    - Replace missing positions with cards that respect **rank constraints** (ensuring ranks
 *      have appeared up to that point).
 * 5. **Return Final Hands**: Return `cardsForA` and `cardsForB` after balancing.
 *
 * Helper Functions:
 * - `shuffleDeck(suits, cardRanks)`: Generates a shuffled deck.
 * - `randomiseArrayFromNtoM(inputArr, outputSize, fillValue)`: Expands an array randomly with placeholders.
 * - `replaceFillWithCard(fillArr, comparingArr, fillPositionArr, cardsArr)`: Replaces placeholders with valid cards.
 *
 * @param {Object} leastBetSide - Defines which side (A or B) should receive each rank first.
 * @returns {Object} { cardsForA, cardsForB } - The final distributed hands for A and B.
 */
export function handleCardDistribution(leastBetSide) {
  const suits = ["S", "C", "D", "H"];
  const cardRanks = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];

  // Step 1: Shuffle the deck
  const deck = shuffleDeck(suits, cardRanks);
  let remainingCards = deck;
  const distributedRanks = new Set();
  const rankAssigned = {}; // Track assigned ranks
  let cardsForA = [];
  let cardsForB = [];

  // Step 2: Ensure each rank appears at least once based on leastBetSide (order maintained)
  while (deck.length > 0 && distributedRanks.size < 13) {
    const card = deck.pop();
    const suit = card[0];
    const rank = card.slice(1);

    if (!rankAssigned[rank]) {
      const leastSide = leastBetSide[rank];

      if (leastSide === "A") {
        cardsForA.push(`${suit}${rank}`);
      } else {
        cardsForB.push(`${suit}${rank}`);
      }

      distributedRanks.add(rank);
      remainingCards = remainingCards.filter((c) => c !== card);
      rankAssigned[rank] = true;
    }
  }

  // console.log({ cardsForA, cardsForB });

  // Step 3: Making sure the number of cards for A and B are equal or differ by one
  if (isEqualOrDiffByOne(cardsForA.length, cardsForB.length)) {
    return { cardsForA, cardsForB };
  }

  let shorterSide;
  let shorterSideCards;
  let longerSideCards;

  if (cardsForA.length < cardsForB.length) {
    shorterSide = "A";
    shorterSideCards = cardsForA;
    longerSideCards = cardsForB;
  } else {
    shorterSide = "B";
    shorterSideCards = cardsForB;
    longerSideCards = cardsForA;
  }

  const outputSize = longerSideCards.length + generateRandomSalt();

  // Step 4: Randomly fill the shorter side with remaining cards
  const { outputArr, fillPositions } = randomiseArrayFromNtoM(
    shorterSideCards,
    outputSize,
    0
  );

  // Step 5: Replace fill positions with valid cards
  const fillArr = replaceFillWithCard(
    outputArr,
    longerSideCards,
    fillPositions,
    remainingCards
  );

  // console.log("Andar Bahar helper", {
  //   outputArr,
  //   fillPositions,
  //   fillArr,
  //   shorterSideCards,
  //   longerSideCards,
  // });

  // Return the final arrays for A and B after interleaving
  return shorterSide === "A"
    ? { cardsForA: fillArr, cardsForB: longerSideCards }
    : { cardsForA: longerSideCards, cardsForB: fillArr };
}
