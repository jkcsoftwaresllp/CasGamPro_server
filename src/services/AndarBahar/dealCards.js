export async function dealCards(gameInstance) {
    const dealInterval = setInterval(async () => {
      if (gameInstance.winner || gameInstance.deck.length === 0) {
        clearInterval(dealInterval);
        await gameInstance.endGame();
        return;
      }
  
      const card = gameInstance.deck.shift();
      if (gameInstance.andarCards.length <= gameInstance.baharCards.length) {
        gameInstance.andarCards.push(card);
        if (gameInstance.compareCards(card, gameInstance.jokerCard)) {
          gameInstance.winner = "Andar";
        }
      } else {
        gameInstance.baharCards.push(card);
        if (gameInstance.compareCards(card, gameInstance.jokerCard)) {
          gameInstance.winner = "Bahar";
        }
      }
  
      await gameInstance.saveState();
    }, gameInstance.CARD_DEAL_INTERVAL);
  }
  