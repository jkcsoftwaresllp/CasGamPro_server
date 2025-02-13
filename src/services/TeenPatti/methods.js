import { GAME_STATES } from "../shared/config/types.js";
import { generateColor, generateHighCard, generatePair, generatePureSequence, generateSequence, generateTrail, } from "./helper.js";
import redis from "../../config/redis.js";

export function generateWinningHand(deck) {
  // Generate a strong hand (e.g., trail, pure sequence, or sequence)
  const handTypes = [
    generateTrail,
    generatePureSequence,
    generateSequence,
    generateColor,
  ];
  const randomHandType =
    handTypes[Math.floor(Math.random() * handTypes.length)];
  return randomHandType(deck);
}

export function generateLosingHand(deck, winningHand) {
  // Generate a hand that's guaranteed to be lower than the winning hand
  const usedCards = new Set(winningHand);
  const availableCards = deck.filter((card) => !usedCards.has(card));

  // Generate a pair or high card hand
  const handTypes = [generatePair, generateHighCard];
  const randomHandType =
    handTypes[Math.floor(Math.random() * handTypes.length)];
  return randomHandType(availableCards);
}
