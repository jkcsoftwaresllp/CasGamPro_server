// export function findLeastBetSide(betTotals) {
//   const leastBetSides = {};

//   Object.keys(betTotals).forEach((card) => {
//     const side = card[0];
//     const cardRank = card.slice(1);

//     if (!leastBetSides[cardRank]) {
//       leastBetSides[cardRank] = { A: 0, B: 0 };
//     }

//     leastBetSides[cardRank][side] += betTotals[card];
//   });

//   const leastBets = {};
//   Object.keys(leastBetSides).forEach((cardRank) => {
//     const betSide = leastBetSides[cardRank];
//     leastBets[cardRank] = betSide.A < betSide.B ? "A" : "B";
//   });

//   return leastBets;
// }
export function findLeastBetSide(betTotals) {
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

    const betA = betTotals[sideA] || 0;
    const betB = betTotals[sideB] || 0;

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
  const deck = shuffleDeck(suits, cardRanks);
  const distributedCards = [];
  const distributedRanks = new Set();
  let sideFlag = true;

  const cardsForA = [];
  const cardsForB = [];

  while (deck.length > 0 && distributedRanks.size < cardRanks.length) {
    const card = deck.pop();
    const suit = card[0];
    const rank = card.slice(1);

    if (!distributedRanks.has(rank)) {
      const leastSide = leastBetSide[rank];
      if (leastSide === "A") {
        cardsForA.push(`${suit}${rank}`);
      } else {
        cardsForB.push(`${suit}${rank}`);
      }
      distributedRanks.add(rank);
      sideFlag = !sideFlag;
    } else {
      const side = sideFlag ? "A" : "B";
      if (side === "A") {
        cardsForA.push(`${suit}${rank}`);
      } else {
        cardsForB.push(`${suit}${rank}`);
      }
      sideFlag = !sideFlag;
    }
  }

  return { cardsForA, cardsForB };
}
