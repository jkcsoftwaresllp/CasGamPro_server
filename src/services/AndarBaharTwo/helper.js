export function initializeBetTotals() {
    return {
      andar: 0,
      bahar: 0,
    };
  }
  
  export function findLeastBetSide(betTotals) {
    const sides = ["andar", "bahar"];
  
    const leastBetSide = sides.reduce((minSide, side) => {
      return betTotals[side] < betTotals[minSide] ? side : minSide;
    });
  
    return leastBetSide;
  }
  
  export function handleCardDistribution(leastBetSide, betTotals) {
    const cards = shuffleDeck(); 
  
    const leastBetRank = getLeastBetCardRank(leastBetSide, betTotals);  
    const distributedCards = distributeCardsBasedOnBets(cards, leastBetRank);
  
    return distributedCards;
  }
  
  function shuffleDeck() {
    const deck = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
    return deck.sort(() => Math.random() - 0.5);  
  }
  
  function getLeastBetCardRank(leastBetSide, betTotals) {
    return betTotals[leastBetSide];
  }
  
  function distributeCardsBasedOnBets(cards, rank) {
    return cards.filter(card => card === rank);
  }
  