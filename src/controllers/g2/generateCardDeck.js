// Generate a shuffled deck as card codes
export const generateCardDeck = () => {
  const suits = ["D", "S", "C", "H"]; // Diamonds, Spades, Clubs, Hearts
  const ranks = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];

  let cardCodes = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      cardCodes.push(`${suit}${rank}`);
    }
  }
  return cardCodes;
};
