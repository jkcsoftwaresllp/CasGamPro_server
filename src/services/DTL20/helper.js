export const findLeastBetCategory = (betTotals) => {
  // Group bet sides into categories
  const categories = {
    dragon: ["dragon", "DR", "DB", "DE", "DO"],
    tiger: ["tiger", "TR", "TB", "TE", "TO"],
    lion: ["lion", "LR", "LB", "LE", "LO"],
  };

  // Calculate total bet amounts for each category
  const categoryTotals = Object.keys(categories).reduce((totals, category) => {
    totals[category] = categories[category].reduce(
      (sum, bet) => sum + (betTotals[bet] || 0),
      0
    );
    return totals;
  }, {});

  // console.log("CategoryTotals: ", categoryTotals);

  // Find the category with the minimum bet
  const minBet = Math.min(...Object.values(categoryTotals));

  // Get all categories with the same minimum bet
  const leastBetCategories = Object.keys(categoryTotals).filter(
    (category) => categoryTotals[category] === minBet
  );

  // Randomly select one if multiple categories have the same minimum bet
  const selectedCategory =
    leastBetCategories[Math.floor(Math.random() * leastBetCategories.length)];

  // Define the bet types under the selected category (R, B, E, O)
  const prefix = selectedCategory.charAt(0).toUpperCase();
  const subCategories = {
    R: `${prefix}R`,
    B: `${prefix}B`,
    E: `${prefix}E`,
    O: `${prefix}O`,
  };

  // Calculate total bet amounts for the subcategories within the selected category
  const subBets = Object.keys(subCategories).reduce((totals, key) => {
    totals[key] = betTotals[subCategories[key]] || 0;
    return totals;
  }, {});

  // Find the minimum in E/O and R/B separately
  const selectedEvenOddCategory = findMinCategory(["E", "O"], subBets);
  const selectedRedBlackCategory = findMinCategory(["R", "B"], subBets);

  return {
    player: selectedCategory,
    evenOdd: selectedEvenOddCategory === "E" ? "even" : "odd",
    redBlack: selectedRedBlackCategory === "R" ? "red" : "black",
  };
};

// Helper function to find the minimum category from given keys
const findMinCategory = (categories, bets) => {
  const minBet = Math.min(...categories.map((key) => bets[key] || 0));
  const minCategories = categories.filter((key) => (bets[key] || 0) === minBet);

  // console.log("minBet on Minimum Catagory: ", minBet);

  return minCategories[Math.floor(Math.random() * minCategories.length)];
};
export function generateThreeCards(evenOdd) {
  const evenCards = ["2", "4", "6", "8", "10", "Q"];
  const oddCards = ["A", "3", "5", "7", "9", "J", "K"];

  // Select the card pool based on evenOdd
  const cardPool = evenOdd === "even" ? evenCards : oddCards;

  // Remove "2" and "A" from possible winners
  const validWinners = cardPool.filter((card) => card !== "2" && card !== "A");

  // Pick the winner card randomly
  const win = validWinners[Math.floor(Math.random() * validWinners.length)];

  // Get numeric value for comparison
  const cardValue = { A: 1, J: 11, Q: 12, K: 13 };
  const winValue = cardValue[win] || parseInt(win, 10);

  // Filter out cards that are less than the winner
  const lesserCards = [...evenCards, ...oddCards].filter((card) => {
    const value = cardValue[card] || parseInt(card, 10);
    return value < winValue;
  });

  // Randomly select two lesser cards
  const loss1 = lesserCards[Math.floor(Math.random() * lesserCards.length)];
  const lesserCards2 = lesserCards.filter((card) => card !== loss1);
  const loss2 = lesserCards2[Math.floor(Math.random() * lesserCards2.length)];

  return { win, loss1, loss2 };
}

// Function to attach red/black suit based on the card
function attachSuit(card, redBlack, isWinner) {
  const redSuits = ["H", "D"]; // (Red)
  const blackSuits = ["S", "C"]; // (Black)

  // For the winner, use red or black based on the evenOdd
  if (isWinner) {
    const suitPrefix =
      redBlack === "red"
        ? redSuits[Math.floor(Math.random() * redSuits.length)]
        : blackSuits[Math.floor(Math.random() * blackSuits.length)];
    return suitPrefix + card;
  } else {
    // For loss cards, choose any random suit prefix
    const allSuits = [...redSuits, ...blackSuits];
    const randomSuit = allSuits[Math.floor(Math.random() * allSuits.length)];
    return randomSuit + card;
  }
}

export const cardsWithSuit = (cards, redblack) => {
  // Attach suits to the winner and loss cards
  const winWithSuit = attachSuit(cards.win, redblack, true);
  const loss1WithSuit = attachSuit(cards.loss1, redblack, false);
  const loss2WithSuit = attachSuit(cards.loss2, redblack, false);

  return { win: winWithSuit, loss1: loss1WithSuit, loss2: loss2WithSuit };
};
