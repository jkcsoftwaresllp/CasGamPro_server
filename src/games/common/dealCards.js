// Currently, only for Andar Bahar

function compareCards(card1, card2) {

  const getRankAndSuit = (card) => {
    const suit = card[0]; // H, D, C, S
    const rank = card.slice(1); // 2, 3, 4, ..., J, Q, K, A
    return { suit, rank };
  };

  const card1Parts = getRankAndSuit(card1);
  const card2Parts = getRankAndSuit(card2);

  return card1Parts.rank === card2Parts.rank;
}

export async function dealCards() {
  const dealInterval = setInterval(async () => {
    if (this.winner || this.deck.length === 0) {
      clearInterval(dealInterval);
      await this.endGame();
      return;
    }

    const card = this.deck.shift();
    if (this.playerA.length <= this.playerB.length) {
      this.playerA.push(card);
      if (compareCards(card, this.jokerCard)) {
        this.winner = "Andar";
      }
    } else {
      this.playerB.push(card);
      if (compareCards(card, this.jokerCard)) {
        this.winner = "Bahar";
      }
    }

    await this.saveState();
    this.broadcastGameState();
  }, this.CARD_DEAL_INTERVAL);
}

