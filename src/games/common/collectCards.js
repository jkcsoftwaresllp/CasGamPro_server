import { logger } from "../../logger/logger.js";
import { GAME_TYPES } from "../../services/shared/config/types.js";

export function collectCards(playerSide) {

  console.log("triggering collect cards");
  console.log("this is: ", this);

  switch (this.gameType) {
    case GAME_TYPES.ANDAR_BAHAR:
      switch (playerSide) {
        case "A":
          return this.playerA;
        case "B":
          return this.playerB;
        default:
          return [];
      }

    case GAME_TYPES.LUCKY7B:
      if (!this.secondCard) {
        return [];
      }
      const rank = this.secondCard.split("")[1];
      switch (playerSide) {
        case "A": // low
          return rank < 7 ? this.secondCard : [];
        case "B": // high
          return rank > 7 ? this.secondCard : [];
        case "C": // mid
          return rank === 7 ? this.secondCard : [];
        default:
          return [];
      }

    case GAME_TYPES.TEEN_PATTI:
      switch (playerSide) {
        case "A":
          return this.player1Cards || [];
        case "B":
          return this.player2Cards || [];
        default:
          return [];
      }

    case GAME_TYPES.DRAGON_TIGER:
      switch (playerSide) {
        case "dragon":
          return this.dragonCard ? [this.dragonCard] : [];
        case "tiger":
          return this.tigerCard ? [this.tigerCard] : [];
        default:
          return [];
      }

    default:
      logger.error(`Unknown game type: ${this.gameType}`);
      return [];
  }
}
