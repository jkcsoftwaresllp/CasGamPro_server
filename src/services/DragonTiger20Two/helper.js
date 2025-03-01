// Group bet sides into categories
const categories = {
  dragon: [
    "dragon",
    "D2",
    "D3",
    "DA",
    "D4",
    "D5",
    "D6",
    "D7",
    "D8",
    "D9",
    "D10",
    "DJ",
    "DQ",
    "DK",
    "dred",
    "deven",
    "dodd",
    "dblack",
  ],
  tiger: [
    "tiger",
    "TA",
    "T2",
    "T3",
    "T4",
    "T5",
    "T6",
    "T7",
    "T8",
    "T9",
    "T10",
    "TJ",
    "TQ",
    "TK",
    "tred",
    "teven",
    "todd",
    "tblack",
  ],
  tie: ["tie"],
  pair: ["pair"],
};

export const findLeastBetCategory = (betTotals) => {
  // Calculate total bet amounts for each category
  const categoryTotals = Object.keys(categories).reduce((totals, category) => {
    totals[category] = categories[category].reduce(
      (sum, bet) => sum + (betTotals[bet] || 0),
      0
    );
    return totals;
  }, {});

  // console.log("Category Totals:", categoryTotals);

  // Find the category with the minimum bet
  const minBet = Math.min(...Object.values(categoryTotals));

  // Get all categories with the same minimum bet
  const leastBetCategories = Object.keys(categoryTotals).filter(
    (category) => categoryTotals[category] === minBet
  );

  // Randomly select one if multiple categories have the same minimum bet
  return leastBetCategories[
    Math.floor(Math.random() * leastBetCategories.length)
  ];
};

/**************************************************************************************************** */

export function handlePairTieCategory(leastBetCategory) {
  if (leastBetCategory === "tie") {
    const card = `${getRandomSuit()}${getRandomRank()}`;
    return {
      blindCard: card,
      dragonCard: card,
      tigerCard: card,
    };
  }

  if (leastBetCategory === "pair") {
    const rank = getRandomRank();
    const suits = ["S", "H", "C", "D"];
    let [suit1, suit2] = [
      suits[Math.floor(Math.random() * 4)],
      suits[Math.floor(Math.random() * 4)],
    ];

    while (suit1 === suit2) {
      suit2 = suits[Math.floor(Math.random() * 4)];
    }

    return {
      blindCard: `${getRandomSuit()}${getRandomRank()}`,
      dragonCard: `${suit1}${rank}`,
      tigerCard: `${suit2}${rank}`,
    };
  }
}

export function handleDragonTigerCategory(mainWinner, betTotals) {
  const oddBets = calculateCategoryBets(mainWinner, "odd", betTotals);
  const evenBets = calculateCategoryBets(mainWinner, "even", betTotals);

  const selectedBetType =
    oddBets === evenBets
      ? Math.random() < 0.5
        ? "odd"
        : "even"
      : oddBets < evenBets
      ? "odd"
      : "even";

  const specificCardBets =
    selectedBetType === "odd"
      ? ["3", "5", "7", "9", "J", "K"]
      : ["2", "4", "6", "8", "10", "Q"];

  const leastBetCard = findLeastBetCard(
    mainWinner,
    specificCardBets,
    betTotals
  );

  const narrowedCards = ["S", "H", "C", "D"].map(
    (suit) => `${suit}${leastBetCard.card}`
  );

  const finalSuit = findFinalSuit(mainWinner, narrowedCards, betTotals);

  const winnerCard = narrowedCards.find((card) => finalSuit.includes(card[0]));
  const loserCard = getLowerRankedCard(winnerCard);

  return {
    blindCard: `${getRandomSuit()}${getRandomRank()}`,
    dragonCard: mainWinner === "dragon" ? winnerCard : loserCard,
    blindCard: `${getRandomSuit()}${getRandomRank()}`,
    tigerCard: mainWinner === "tiger" ? winnerCard : loserCard,
    winner: {
      player: mainWinner,
      evenOdd: selectedBetType,
      redBlack: ["D", "H"].includes(winnerCard.slice(0, 1)) ? "red" : "black",
      card: winnerCard,
    },
  };
}

export function calculateCategoryBets(mainWinner, category, betTotals) {
  const betTypes = {
    odd: ["Odd", "A", "3", "5", "7", "9", "J", "K"],
    even: ["Even", "2", "4", "6", "8", "10", "Q"],
  };

  return betTypes[category].reduce(
    (acc, card) => acc + (betTotals[`${mainWinner}${card}`] || 0),
    0
  );
}

export function findLeastBetCard(mainWinner, cards, betTotals) {
  return cards.reduce(
    (min, card) => {
      const bet = betTotals[`${mainWinner}${card}`] || 0;
      return bet < min.amount ? { card, amount: bet } : min;
    },
    { card: cards[0], amount: Infinity }
  );
}

export function findFinalSuit(mainWinner, narrowedCards, betTotals) {
  const blackBets = narrowedCards
    .filter((card) => card.includes("S") || card.includes("C"))
    .reduce((acc, card) => acc + (betTotals[`${mainWinner}Black`] || 0), 0);
  const redBets = narrowedCards
    .filter((card) => card.includes("H") || card.includes("D"))
    .reduce((acc, card) => acc + (betTotals[`${mainWinner}Red`] || 0), 0);

  return blackBets === redBets
    ? Math.random() < 0.5
      ? ["S", "C"]
      : ["H", "D"]
    : blackBets < redBets
    ? ["S", "C"]
    : ["H", "D"];
}

export function getLowerRankedCard(card) {
  const rankOrder = [
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
  const rank = card[1];
  const rankIndex = rankOrder.indexOf(rank);
  const lowerRank = rankIndex > 0 ? rankOrder[rankIndex - 1] : rankOrder[0];
  return `${card[0]}${lowerRank}`;
}

export function getRandomSuit() {
  return ["S", "H", "C", "D"][Math.floor(Math.random() * 4)];
}

export function getRandomRank() {
  return ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][
    Math.floor(Math.random() * 13)
  ];
}
