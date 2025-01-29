export function findLeastBetCategory(categories, bets) {
  return categories.reduce((min, category) =>
    (bets[category] || 0) < (bets[min] || 0) ? category : min
  );
}

export function narrowDownCards(leastBets) {
  let cards = [];

  // 1. First filter by even/odd
  if (leastBets.evenOdd === "even") {
    cards = ["2", "4", "6", "8", "10"];
  } else {
    cards = ["A", "3", "5", "7", "9"];
  }

  // 2. Apply suit based on black/red
  if (leastBets.blackRed === "black") {
    cards = cards.map(card => [`S${card}`, `C${card}`]).flat();
  } else {
    cards = cards.map(card => [`H${card}`, `D${card}`]).flat();
  }

  // 3. Filter by high/low/mid
  return cards.filter(card => {
    const rank = card.slice(1);
    switch(leastBets.lowMidHigh) {
      case "high":
        return ["8", "10", "J", "Q", "K"].includes(rank);
      case "low":
        return ["A", "2", "3", "4", "5", "6"].includes(rank);
      case "mid":
        return ["7"].includes(rank);
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
  if (["A", "2", "3", "4", "5", "6"].includes(rank)) {
    categories.push("low");
  } else if (rank === "7") {
    categories.push("mid");
  } else {
    categories.push("high");
  }

  // Add even/odd category
  if (["2", "4", "6", "8", "10"].includes(rank)) {
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
