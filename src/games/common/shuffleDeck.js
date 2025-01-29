import redis from "../../config/redis.js";
import { logger } from "../../logger/logger.js";

export async function shuffleDeck() {

  const deck = this.deck;
  
  try {
    const bets = await redis.hgetall(`bets:${this.gameId}`);

    let andarTotal = 0, baharTotal = 0;

    Object.values(bets).forEach((betData) => {
      const bet = JSON.parse(betData);
      if (bet.side === "Andar") {
        andarTotal += parseFloat(bet.amount);
      } else if (bet.side === "Bahar") {
        baharTotal += parseFloat(bet.amount);
      }
    });

    const favorSide = andarTotal > baharTotal ? "Bahar" : "Andar";
    const jokerCardIndex = deck.findIndex((card) => card === this.jokerCard);
    const [removedJokerCard] = deck.splice(jokerCardIndex, 1);

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const insertPosition =
      favorSide === "Andar"
        ? Math.floor(Math.random() * (deck.length / 2))
        : Math.floor(deck.length / 2) +
          Math.floor(Math.random() * (deck.length / 2));

    deck.splice(insertPosition, 0, removedJokerCard);

    return deck;
  } catch (error) {
    logger.error("Error in shuffleDeck:", error);
    return deck.sort(() => Math.random() - 0.5);
  }
}
