  export function initializeBetTotals(bets) {
    const betTotals = {};
  
    const cardRanks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const sides = ["A", "B"];  
  
    cardRanks.forEach(rank => {
      sides.forEach(side => {
        const card = `${side}${rank}`;
        betTotals[card] = 0; 
      });
    });
  
    for (const [playerId, betData] of Object.entries(bets)) {
      const bet = JSON.parse(betData);
      const { card, amount } = bet;
      
      if (betTotals[card] !== undefined) {
        betTotals[card] += parseFloat(amount);
      }
    }
  
    return betTotals;
  }
  
  /*export function findLeastBetSide(betTotals) {
    const leastBetSides = {};
  
    Object.keys(betTotals).forEach(card => {
      const [side, cardRank] = card.split('');  
  
      if (!leastBetSides[cardRank]) {
        leastBetSides[cardRank] = { A: 0, B: 0 };
      }
  
      if (side === "A") {
        leastBetSides[cardRank].A += betTotals[card];
      } else {
        leastBetSides[cardRank].B += betTotals[card];
      }
    });
  
    const leastBets = {};
    Object.keys(leastBetSides).forEach(cardRank => {
      const betSide = leastBetSides[cardRank];
      leastBets[cardRank] = betSide.A < betSide.B ? "A" : "B";  
    });
  
    return leastBets;
  }*/

    export function findLeastBetSide(betTotals) {
      const leastBetSides = {};
    
      // Iterate through each bet, grouping by card rank (2, 3, 4, ..., K)
      Object.keys(betTotals).forEach(card => {
        // Extract card rank and side
        const side = card[0]; // 'A' or 'B'
        const cardRank = card.slice(1); // '2', '3', '4', ..., 'K'
    
        // Initialize the rank object if it doesn't exist
        if (!leastBetSides[cardRank]) {
          leastBetSides[cardRank] = { A: 0, B: 0 };
        }
    
        // Add the bet to the appropriate side
        leastBetSides[cardRank][side] += betTotals[card];
      });
    
      // Now determine which side has the least bet for each card rank
      const leastBets = {};
      Object.keys(leastBetSides).forEach(cardRank => {
        const betSide = leastBetSides[cardRank];
        leastBets[cardRank] = betSide.A < betSide.B ? "A" : "B";  // Least bet side
      });
    
      return leastBets;
    }

export function handleCardDistribution(leastBetSide, betTotals) {
  const cards = shuffleDeck();
  const distributedCards = [];

  const suits = ["S", "C", "D", "H"];  
  const cardRanks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];  
  
  cardRanks.forEach(rank => {
    const cardAndar = `${rank}A`;  
    const cardBahar = `${rank}B`;  

    const leastSide = leastBetSide[rank]; 

    const allCardsOfRank = suits.map(suit => `${rank}${suit}`);

    if (leastSide === "A") {
      distributedCards.push(allCardsOfRank[0]);  
      distributedCards.push(...allCardsOfRank.slice(1));  
    } else {
      distributedCards.push(allCardsOfRank[0]);  
      distributedCards.push(...allCardsOfRank.slice(1));  
    }
  });

  return distributedCards;
}


  
  function shuffleDeck() {
    const deck = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
    return deck.sort(() => Math.random() - 0.5); // Shuffle the deck randomly
  }
  