import { logger } from "../../logger/logger.js";
import { GAME_STATES, GAME_TYPES } from "../../services/shared/config/types.js";

export async function startDealing() {
  try {
    this.status = GAME_STATES.DEALING;

    switch (this.gameType) {
      case GAME_TYPES.ANDAR_BAHAR_TWO:
        this.deck = await this.shuffleDeck();
        this.jokerCard = this.deck.shift();
        await this.dealCards();
        break;

      case GAME_TYPES.LUCKY7B:
        this.blindCard = this.deck.shift();
        this.secondCard = await this.calculateResult(); // Sets the second card
        this.logGameState("Dealing Phase Started");
        setTimeout(async () => {
          await this.revealCards();
        }, this.CARD_DEAL_DURATION);
        break;

      case GAME_TYPES.TEEN_PATTI:
        this.blindCard = this.deck.shift();
        for (let i = 0; i < 3; i++) {
          this.players.A.push(this.deck.shift());
          this.players.B.push(this.deck.shift());
        }
        this.logGameState("Dealing Phase Started");
        this.winner = await this.calculateResult();
        setTimeout(async () => {
          await this.determineWinner();
        }, this.CARD_DEAL_DURATION);
        break;

      case GAME_TYPES.DRAGON_TIGER:
        await this.calculateResult();
        this.logGameState("Dealing Phase Started");
        setTimeout(async () => {
          await this.determineWinner();
        }, this.CARD_DEAL_DURATION);
        break;

      case GAME_TYPES.ANDAR_BAHAR:
        this.currentRoundCards = [];
        this.winner = null;

        this.logGameState("Dealing Phase Started");

        setTimeout(async () => {
          await this.determineWinner();
        }, this.CARD_DEAL_DURATION);
        break;


      case GAME_TYPES.DRAGON_TIGER_LION:
        //this.deck = await this.shuffleDeck();
        this.players.A = [this.deck.shift()];
        this.players.B = [this.deck.shift()];
        this.players.C = [this.deck.shift()];
        this.blindCard = this.deck.shift();
        this.logGameState("Dealing Phase Started");

        setTimeout(async () => {
          await this.determineWinner();
        }, this.CARD_DEAL_DURATION);
        break;

      default:
        logger.error(`Unknown game type: ${this.gameType}`);
        break;
    }
  } catch (error) {
    logger.error(`Failed to start dealing for ${this.gameType}:`, error);
  }
}
