import { logger } from "../../logger/logger.js";

// TODO: Andar-Bahar cards will be changed to playerA and playerB

export function logSpecificGameState(jokerCard, andarCards, baharCards) {
  logger.info("Joker Card:", jokerCard);
  logger.info("Andar Cards:", andarCards.join(", "));
  logger.info("Bahar Cards:", baharCards.join(", "));
}
