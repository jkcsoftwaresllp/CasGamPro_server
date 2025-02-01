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

export default class AndarBaharGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.gameType = GAME_TYPES.ANDAR_BAHAR;
    this.betResults = {
      andar: [],
      bahar: [],
    };
    this.betsPlaced = { andar: 0, bahar: 0}; // Track the total bets for each side
    this.currentRoundCards = [];
    this.winner = null;
    this.real_winner = null;
    this.BETTING_PHASE_DURATION = 30000;  // 30 seconds for betting
    this.CARD_DEAL_DURATION = 3000;      // 3 seconds for card reveal
    this.gameInterval = null;
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
    folderLogger('game_logs/AndarBahar', 'AndarBahar2').info(JSON.stringify({
      gameType: this.gameType,
      status: this.status,
      winner: this.winner,
      currentRoundCards: this.currentRoundCards,
    }, null, 2));  // Format logs for readability
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
