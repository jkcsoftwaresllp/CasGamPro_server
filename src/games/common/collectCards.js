export function collectCards(gameType, gameInstance, playerSide) {
  // Andar Bahar
  if (gameType === "AndarBahar") {
    const { andarCards, baharCards } = gameInstance;
    switch (playerSide) {
      case "A":
        return andarCards;
      case "B":
        return baharCards;
      default:
        return [];
    }
  }

  // Lucky 7B 
  if (gameType === "Lucky7B") {
    console.log(gameInstance.status, gameInstance.secondCard);

    if (!gameInstance.secondCard) {
      return [];
    }

    const rank = gameInstance.secondCard.split('')[1];
    console.log("rank set", rank);

    switch (playerSide) {
      case "A": // low
        return rank < 7 ? gameInstance.secondCard : [];
      case "B": // high
        return rank > 7 ? gameInstance.secondCard : [];
      case "C": // mid
        return rank === 7 ? gameInstance.secondCard : [];
      default:
        return [];
    }
  }

  // Default case for unsupported game types
  console.error(`Unknown game type: ${gameType}`);
  return [];
}
