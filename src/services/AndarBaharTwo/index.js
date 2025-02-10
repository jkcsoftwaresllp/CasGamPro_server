import { startDealing } from "../../games/common/startDealing.js";
import { getDeckBasedOnBets } from "../../games/common/shuffleDeck.js";
import { dealCards } from "../../games/common/dealCards.js";
import BaseGame from "../shared/config/base_game.js";
import { GAME_STATES, GAME_TYPES } from "../shared/config/types.js";
import { folderLogger } from "../../logger/folderLogger.js";

export default class AndarBaharTwoGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.gameType = GAME_TYPES.ANDAR_BAHAR_TWO; //workaround for now
    this.jokerCard = null;
    this.players = {
      A: [],
      B: [],
    }
    this.betSides = ["Andar", "Bahar"];
    this.winner = null;
    this.status = GAME_STATES.WAITING;
    this.BETTING_PHASE_DURATION = 2000;
    this.CARD_DEAL_INTERVAL = 1000;
  }

  async firstServe() {
    this.deck = await this.shuffleDeck();
    this.jokerCard = this.deck.shift();
  }

}

AndarBaharTwoGame.prototype.startDealing = startDealing;
AndarBaharTwoGame.prototype.shuffleDeck = getDeckBasedOnBets;
AndarBaharTwoGame.prototype.dealCards = dealCards;
