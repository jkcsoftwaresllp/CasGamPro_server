const lowCards = ["A", "2", "3", "4", "5", "6"];
const midCards = ["7"];
const highCards = ["8", "9", "10", "J", "Q", "K"];

const evenCards = ["2", "4", "6", "8", "10", "Q"];
const oddCards = ["A", "3", "5", "7", "9", "J", "K"];

export function findLeastBetCategory(categories, bets) {
  // Find the minimum bet amount
  const minBet = Math.min(...categories.map((category) => bets[category] || 0));

  // Get all categories that have the minimum bet
  const leastBetCategories = categories.filter(
    (category) => (bets[category] || 0) === minBet
  );

  // Randomly select one if there are multiple with the same min bet
  return leastBetCategories[
    Math.floor(Math.random() * leastBetCategories.length)
  ];
}

// Function to categorize number cards
const mapBetsToCategories = (bets) => {
  const mappedBets = {};

  // Ensure all categories exist in mapped bets
  mappedBets.low = bets.low || 0;
  mappedBets.mid = bets.mid || 0;
  mappedBets.high = bets.high || 0;
  mappedBets.even = bets.even || 0;
  mappedBets.odd = bets.odd || 0;
  mappedBets.black = bets.black || 0;
  mappedBets.red = bets.red || 0;

  // Sum up bets for each category while also considering direct bets on them
  Object.keys(bets).forEach((bet) => {
    if (lowCards.includes(bet)) {
      mappedBets.low += bets[bet]; // Add individual card bets to low
    } else if (midCards.includes(bet)) {
      mappedBets.mid += bets[bet]; // Add individual card bets to mid
    } else if (highCards.includes(bet)) {
      mappedBets.high += bets[bet]; // Add individual card bets to high
    }

    if (evenCards.includes(bet)) {
      mappedBets.even += bets[bet]; // Add individual card bets to even
    } else if (oddCards.includes(bet)) {
      mappedBets.odd += bets[bet]; // Add individual card bets to odd
    }
  });

  return mappedBets;
};

// Function to determine the least bet category while handling mid-7 issue
export function getLeastBetWithValidation(bets) {
  const categories = {
    lowMidHigh: ["low", "mid", "high"],
    evenOdd: ["even", "odd"],
    blackRed: ["black", "red"],
  };

  const processedBets = mapBetsToCategories(bets);

  let leastBets = {
    lowMidHigh: findLeastBetCategory(categories.lowMidHigh, processedBets),
    evenOdd: findLeastBetCategory(categories.evenOdd, processedBets),
    blackRed: findLeastBetCategory(categories.blackRed, processedBets),
  };

  // Fixing the "mid-7 issue"
  if (leastBets.lowMidHigh === "mid" && leastBets.evenOdd === "even") {
    // "Mid" (7) is selected, but it's not even → Change it!
    leastBets.lowMidHigh =
      processedBets.low <= processedBets.high ? "low" : "high";
  }

  return leastBets;
}

export function narrowDownCards(leastBets) {
  let cards = [];

  // 1. First filter by even/odd
  if (leastBets.evenOdd === "even") {
    cards = evenCards;
  } else {
    cards = oddCards;
  }

  // 2. Apply suit based on black/red
  if (leastBets.blackRed === "black") {
    cards = cards.map((card) => [`S${card}`, `C${card}`]).flat();
  } else {
    cards = cards.map((card) => [`H${card}`, `D${card}`]).flat();
  }

  // 3. Filter by high/low/mid
  return cards.filter((card) => {
    const rank = card.slice(1);
    switch (leastBets.lowMidHigh) {
      case "high":
        return highCards.includes(rank);
      case "low":
        return lowCards.includes(rank);
      case "mid":
        return midCards.includes(rank);
      default:
        return true;
    }
  });
}

export function selectRandomCard(cards) {
  return cards[Math.floor(Math.random() * cards.length)];
}

export function determineWinningCategory(card) {
  const rank = card.slice(1);
  const suit = card[0];

  const categories = [];

  // Add low/mid/high category
  if (lowCards.includes(rank)) {
    categories.push("low");
  } else if (rank === "7") {
    categories.push("mid");
  } else {
    categories.push("high");
  }

  // Add even/odd category
  if (evenCards.includes(rank)) {
    categories.push("even");
  } else {
    categories.push("odd");
  }

  // Add black/red category
  if (["S", "C"].includes(suit)) {
    categories.push("black");
  } else {
    categories.push("red");
  }

  return categories;
}
