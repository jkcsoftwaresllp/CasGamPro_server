export function generateRankedCards(deck, numCards) {
    const ranks = ["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
    const suits = ["S", "H", "C", "D"];
  
    const selectedCards = [];
    while (selectedCards.length < numCards) {
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const card = `${suit}${rank}`;
      
      if (!selectedCards.includes(card)) {
        selectedCards.push(card);
      }
    }
  
    return selectedCards;
  }
  
  export function generateSideCard(sideBets, suitRanking, rankRanking) {
    const ranks = ["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
    const suits = ["S", "H", "C", "D"];
    const filteredSuits = suits.filter(suit => suitRanking.includes(suit));
    const filteredRanks = ranks.filter(rank => rankRanking.includes(rank));
  
    const selectedSuit = filteredSuits[Math.floor(Math.random() * filteredSuits.length)];
    const selectedRank = filteredRanks[Math.floor(Math.random() * filteredRanks.length)];
  
    return `${selectedSuit}${selectedRank}`;
  }
  
  export function getSuitRanking(betData) {
    const suitBets = { S: 0, H: 0, C: 0, D: 0 };
  
    Object.entries(betData).forEach(([key, value]) => {
      const { side, bet } = JSON.parse(value);
      if (side === "Black") suitBets[key] += bet;
    });
  
    return Object.entries(suitBets)
      .sort((a, b) => a[1] - b[1])
      .map(([suit, bet]) => suit);
  }
  
  export function getRankRanking(betData) {
    const rankBets = { Even: 0, Odd: 0 };
  
    Object.entries(betData).forEach(([key, value]) => {
      const { side, bet } = JSON.parse(value);
      if (side === "Even") rankBets["Even"] += bet;
      if (side === "Odd") rankBets["Odd"] += bet;
    });
  
    return rankBets["Even"] <= rankBets["Odd"] ? ["Even"] : ["Odd"];
  }
  
  