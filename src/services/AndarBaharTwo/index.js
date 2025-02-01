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

export default class AndarBaharTwoGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.gameType = GAME_TYPES.ANDAR_BAHAR_TWO; //workaround for now
    this.jokerCard = null;
    this.playerA = []; // ANDAR
    this.playerB = []; // BAHAR
    this.betSides = ["Andar", "Bahar"];
    this.winner = null;
    this.status = GAME_STATES.WAITING;
    this.BETTING_PHASE_DURATION = 20000; // Example value
    this.CARD_DEAL_INTERVAL = 3000; // Example value
  }

  async saveState() {
    await super.saveState();
  }

  async recoverState() {
    const state = await recoverState("AndarBaharTwo", this.gameId, () =>
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
    folderLogger('game_logs/AndarBaharTwoTwo', 'AndarBaharTwo').info(JSON.stringify({
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

AndarBaharTwoGame.prototype.start = startGame;
AndarBaharTwoGame.prototype.startDealing = startDealing;
AndarBaharTwoGame.prototype.shuffleDeck = shuffleDeck; // possible error prone
AndarBaharTwoGame.prototype.dealCards = dealCards;
AndarBaharTwoGame.prototype.endGame = endGame;
AndarBaharTwoGame.prototype.storeGameResult = storeGameResult;
AndarBaharTwoGame.prototype.resetGame = resetGame;
AndarBaharTwoGame.prototype.getBetMultiplier = getBetMultiplier;
