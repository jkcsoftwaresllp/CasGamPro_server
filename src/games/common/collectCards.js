// Collect cards function for Andar Bahar
export function collectCardsAndarBahar(playerSide, andarCards, baharCards) {
  switch (playerSide) {
    case "A":
      return andarCards;
    case "B":
      return baharCards;
    default:
      return [];
  }
}

// Collect cards function for Lucky 7B
export function collectCardsLucky7B(gameInstance, playerSide) {
  console.log(gameInstance.status, gameInstance.secondCard);

  if (!gameInstance.secondCard) {
    return [];
  }

  const rank = gameInstance.secondCard.split('')[1];
  console.log("rank set", rank);

  switch (playerSide) {
    case "A": // low
      return rank < 7 ? gameInstance.secondCard : []; // TODO: 'Clarify equal to 7' case.
    case "B": // high
      return rank > 7 ? gameInstance.secondCard : [];
    case "C": // mid
      return rank === 7 ? gameInstance.secondCard : [];
    default:
      return [];
  }
}