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
import resetGame from "../../games/common/resetGame.js";
import { collectCards } from "../../games/common/collectCards.js";
import { folderLogger } from "../../logger/folderLogger.js";

export default class AndarBaharGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.gameType = GAME_TYPES.ANDAR_BAHAR; //workaround for now
    this.jokerCard = null;
    this.playerA = []; // ANDAR
    this.playerB = []; // BAHAR
    this.betSides = ["andar", "bahar"];
    this.winner = null;
    this.real_winner = null; //talk about workarounds
    this.status = GAME_STATES.WAITING;
    this.BETTING_PHASE_DURATION = 2000; // Example value
    this.CARD_DEAL_INTERVAL = 3000; // Example value
  }

  async saveState() {
    await super.saveState();
  }

  async recoverState() {
    const state = await recoverState("AndarBahar", this.gameId, () =>
      super.recoverState()
    );
    if (state) {
      this.jokerCard = state.jokerCard;
      this.playerA = state.playerA;
      this.playerB = state.playerB;
    }
  }

  logSpecificGameState() {
    return;
    console.log("Joker:", this.jokerCard);
    console.log("Player A (andar):", this.playerA.join(", "));
    console.log("Player B (bahar):", this.playerB.join(", "));
  }

  logGameState(event) {
    folderLogger('game_logs/AndarBahar', 'AndarBahar').info(JSON.stringify({
      gameType: this.gameType,
      status: this.status,
      winner: this.winner,
      jokerCard: this.jokerCard,
      andarCards: this.andarCards,
      baharCards: this.baharCards
    }, null, 2)); // Using a 2-space indentation for better formatting
    return;
  }
}

AndarBaharGame.prototype.start = startGame;
AndarBaharGame.prototype.startDealing = startDealing;
AndarBaharGame.prototype.shuffleDeck = shuffleDeck; // possible error prone
AndarBaharGame.prototype.dealCards = dealCards;
AndarBaharGame.prototype.endGame = endGame;
AndarBaharGame.prototype.storeGameResult = storeGameResult;
AndarBaharGame.prototype.resetGame = resetGame;
AndarBaharGame.prototype.getBetMultiplier = getBetMultiplier;
