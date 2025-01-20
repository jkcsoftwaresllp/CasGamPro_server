export function compareCards(card1, card2) {
    const getRankAndSuit = (card) => {
      const suit = card[0]; // H, D, C, S
      const rank = card.slice(1); // 2, 3, 4, ..., J, Q, K, A
      return { suit, rank };
    };
  
    const card1Parts = getRankAndSuit(card1);
    const card2Parts = getRankAndSuit(card2);
  
    return card1Parts.rank === card2Parts.rank && card1Parts.suit === card2Parts.suit;
  }
  