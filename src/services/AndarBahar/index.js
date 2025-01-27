import { collectCards } from "../../games/common/collectCards.js";
import gameManager from "../shared/config/manager.js";
import { recoverState } from "../../games/common/recoverState.js";
import { startGame } from "../../games/common/start.js";
import { startDealing } from "../../games/common/startDealing.js";
import { shuffleDeck } from "../../games/common/shuffleDeck.js";
import { dealCards } from "../../games/common/dealCards.js";
import { endGame } from "../../games/common/endGame.js";
import { storeGameResult } from "../../games/common/storeGameResult.js";
import { getBetMultiplier } from "../../games/common/getBetMultiplier.js";
import BaseGame from "../shared/config/base_game.js";
import { GAME_STATES, GAME_TYPES } from "../shared/config/types.js";
import redis from "../../config/redis.js";

export default class AndarBaharGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.gameType = GAME_TYPES.ANDAR_BAHAR; //workaround for now
    this.jokerCard = null;
    this.andarCards = [];
    this.baharCards = [];
    this.betSides = ["Andar", "Bahar"];
    this.winner = null;
    this.status = GAME_STATES.WAITING;
    this.BETTING_PHASE_DURATION = 2000; // Example value
    this.CARD_DEAL_INTERVAL = 300; // Example value
  }

  collectCards(playerSide) {
    return collectCards("AndarBahar", this, playerSide);
  }

  async saveState() {
    await super.saveState();
  }

  async recoverState() {
    const state = await recoverState("AndarBahar", this.gameId, () => super.recoverState());
    if (state) {
      this.jokerCard = state.jokerCard;
      this.andarCards = state.andarCards;
      this.baharCards = state.baharCards;
    }
  }

  resetGame() {
    this.jokerCard = null;
    this.andarCards = [];
    this.baharCards = [];
    this.winner = null;
    this.status = null;
    this.deck = this.initializeDeck();
  }

  logSpecificGameState() {
    console.log("Joker Card:", this.jokerCard);
    console.log("Andar Cards:", this.andarCards.join(", "));
    console.log("Bahar Cards:", this.baharCards.join(", "));
  }

  async getBetMultiplier(betSide) {
    return await getBetMultiplier("AndarBahar", betSide);
  }
};

AndarBaharGame.prototype.start = startGame;
AndarBaharGame.prototype.startDealing = startDealing;
AndarBaharGame.prototype.dealCards = dealCards;
AndarBaharGame.prototype.shuffleDeck = shuffleDeck;
AndarBaharGame.prototype.endGame = endGame;
AndarBaharGame.prototype.storeGameResult = storeGameResult;
