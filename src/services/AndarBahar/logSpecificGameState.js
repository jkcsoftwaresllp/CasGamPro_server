import { logger } from "../../logger/logger";

export function logSpecificGameState(jokerCard, andarCards, baharCards) {
  logger.info("Joker Card:", jokerCard);
  logger.info("Andar Cards:", andarCards.join(", "));
  logger.info("Bahar Cards:", baharCards.join(", "));
}
