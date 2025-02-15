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

      export function findLeastBetSide(betTotals) {
      const leastBetSides = {};

      Object.keys(betTotals).forEach(card => {
        const side = card[0];
        const cardRank = card.slice(1);

        if (!leastBetSides[cardRank]) {
          leastBetSides[cardRank] = { A: 0, B: 0 };
        }

        leastBetSides[cardRank][side] += betTotals[card];
      });

      const leastBets = {};
      Object.keys(leastBetSides).forEach(cardRank => {
        const betSide = leastBetSides[cardRank];
        leastBets[cardRank] = betSide.A < betSide.B ? "A" : "B";
      });

      return leastBets;
    }

    function shuffleDeck(suits, cardRanks) {
      const deck = [];
      
      suits.forEach(suit => {
        cardRanks.forEach(rank => {
          deck.push(`${suit}${rank}`);
        });
      });
      
      return deck.sort(() => Math.random() - 0.5);
    }
    
    export function handleCardDistribution(leastBetSide) {
      const suits = ["S", "C", "D", "H"];
      const cardRanks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
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
          const side = sideFlag ? 'A' : 'B';
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