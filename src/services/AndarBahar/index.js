import { collectCards } from "../../games/common/collectCards.js";
import { recoverState } from "../../games/common/recoverState.js";
import { startGame } from "../../games/common/start.js";
import { startDealing } from "../../games/common/startDealing.js";
import { storeGameResult } from "../../games/common/storeGameResult.js";
import { endGame } from "../../games/common/endGame.js";
import { getBetMultiplier } from "../../games/common/getBetMultiplier.js";
import BaseGame from "../shared/config/base_game.js";
import { GAME_STATES, GAME_TYPES } from "../shared/config/types.js";
import { determineOutcome, distributeWinnings, determineWinner } from "./method.js";
import resetGame from "../../games/common/resetGame.js";
import { folderLogger } from "../../logger/folderLogger.js";
import { initializeBetTotals, findLeastBetSide, handleCardDistribution } from "./helper.js";

export default class AndarBaharGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.gameType = GAME_TYPES.ANDAR_BAHAR; //workaround for now
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
    const state = await recoverState("AndarBahar", this.gameId, () =>
      super.recoverState(),
    );
    if (state) {
      this.currentRoundCards = state.currentRoundCards;
      this.betResults = state.betResults;
      this.winner = state.winner;
    }
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
AndarBaharGame.prototype.determineWinner = determineWinner;
AndarBaharGame.prototype.endGame = endGame;
AndarBaharGame.prototype.storeGameResult = storeGameResult;
AndarBaharGame.prototype.distributeWinnings = distributeWinnings;
AndarBaharGame.prototype.getBetMultiplier = getBetMultiplier;
AndarBaharGame.prototype.resetGame = resetGame;
AndarBaharGame.prototype.determineOutcome = determineOutcome;
