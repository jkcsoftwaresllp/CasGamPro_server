// API: Arrange Stack
export const arrangeStack = (req, res) => {
  if (!gameState.jokerCard) {
    return res.status(400).json({ error: "Joker card not revealed yet" });
  }

  const { Andar, Bahar } = gameState.bets;
  gameState.winnerSide =
    Andar > Bahar
      ? "Bahar"
      : Andar < Bahar
      ? "Andar"
      : Math.random() > 0.5
      ? "Andar"
      : "Bahar";

  const jokerCardRank = gameState.jokerCard;
  const nonJokerCards = gameState.cardKeys.filter(
    (key) => !gameState.cardMap[key].endsWith(jokerCardRank)
  );

  // Build stack with the joker card at the end
  const jokerCardHash = gameState.cardKeys.find((key) =>
    gameState.cardMap[key].endsWith(jokerCardRank)
  );
  if (!jokerCardHash) {
    return res.status(500).json({ error: "Joker card not found in deck" });
  }

  const randomCardCount = Math.max(3, Math.floor(Math.random() * 40) + 3); // Random length >= 3
  const isEven = gameState.winnerSide === "Bahar";

  let stack = [];
  let addedCards = 0;
  while (addedCards < randomCardCount - 1 && nonJokerCards.length > 0) {
    const cardIndex = Math.floor(Math.random() * nonJokerCards.length);
    const selectedCard = nonJokerCards.splice(cardIndex, 1)[0];

    // Avoid duplicate ranks of the joker card
    if (!gameState.cardMap[selectedCard].endsWith(jokerCardRank)) {
      stack.push(selectedCard);
      addedCards++;
    }
  }

  // Ensure the total cards added align with the even/odd requirement
  if ((addedCards % 2 === 0) !== isEven) {
    stack.pop();
    addedCards--;
  }

  // Add the joker card as the last card in the stack
  stack.push(jokerCardHash);

  gameState.stack = stack;

  console.log(
    "Final Stack:",
    gameState.stack.map((hash) => gameState.cardMap[hash])
  );
  res.json({ stackLength: gameState.stack.length });
};
