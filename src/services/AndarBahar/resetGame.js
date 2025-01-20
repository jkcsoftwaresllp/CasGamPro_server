export function resetGame(gameInstance) {
    gameInstance.jokerCard = null;
    gameInstance.andarCards = [];
    gameInstance.baharCards = [];
    gameInstance.winner = null;
    gameInstance.status = null;
    gameInstance.deck = gameInstance.initializeDeck();
  }
  