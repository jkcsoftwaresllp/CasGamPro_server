import redis from "../../config/redis.js";
import { logger } from "../../logger/logger.js";

// Function to calculate the result based on bets and cards
export async function calculateResult(gameInstance) {
  let betsmap = { low: 0, high: 0, mid: 0, odd: 0, even: 0, black: 0, red: 0 };

  try {
    const bets = await redis.hgetall(`bets:${gameInstance.gameId}`);

    Object.values(bets).forEach((betData) => {
      const bet = JSON.parse(betData);
      betsmap[bet.side] += parseFloat(bet.amount);
    });

    const lowMidHigh = ["low", "mid", "high"];
    const evenOdd = ["even", "odd"];
    const blackRed = ["black", "red"];

    // Find the category with the least bets in each group
    const leastLowMidHigh = lowMidHigh.reduce((min, category) =>
      betsmap[category] < betsmap[min] ? category : min
    );
    const leastEvenOdd = evenOdd.reduce((min, category) =>
      betsmap[category] < betsmap[min] ? category : min
    );
    const leastBlackRed = blackRed.reduce((min, category) =>
      betsmap[category] < betsmap[min] ? category : min
    );

    // Narrowing down cards
    let narrowedDownCards = [];

    if (leastEvenOdd === "even") {
      narrowedDownCards = ["2", "4", "6", "8", "10"];
    } else if (leastEvenOdd === "odd") {
      narrowedDownCards = ["A", "3", "5", "7", "9"];
    }

    if (leastBlackRed === "black") {
      narrowedDownCards = narrowedDownCards
        .filter((card) =>
          [
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
          ].includes(card)
        )
        .map((card) => [`S${card}`, `C${card}`])
        .flat();
    } else if (leastBlackRed === "red") {
      narrowedDownCards = narrowedDownCards
        .filter((card) =>
          [
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
          ].includes(card)
        )
        .map((card) => [`H${card}`, `D${card}`])
        .flat();
    }

    if (leastLowMidHigh === "high") {
      narrowedDownCards = narrowedDownCards.filter((card) =>
        ["8", "10", "J", "Q", "K"].includes(card.split("")[1])
      );
    } else if (leastLowMidHigh === "low") {
      narrowedDownCards = narrowedDownCards.filter((card) =>
        ["A", "2", "3", "4", "5", "6"].includes(card.split("")[1])
      );
    } else if (leastLowMidHigh === "mid") {
      narrowedDownCards = narrowedDownCards.filter((card) =>
        ["7"].includes(card.split("")[1])
      );
    }

    // Step 3: Randomly select a card from the narrowed down set
    return narrowedDownCards[
      Math.floor(Math.random() * narrowedDownCards.length)
    ];
  } catch (error) {
    logger.error("Failed to shuffle deck:", error);
  }
}
