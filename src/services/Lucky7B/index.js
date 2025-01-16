import { collectCardsLucky7B } from "../../games/common/collectCards.js";
import { saveStateLucky7B } from "../../games/common/saveState.js";
import { recoverStateLucky7B } from "../../games/common/recoverState.js";
import { startLucky7B } from "../../games/common/start.js";
import { startDealingLucky7B } from "../../games/common/startDealing.js";
import { revealCards } from "./revealCards.js";
import { calculateResult } from "./calculateResult.js";
import { distributeWinnings } from "./distributeWinnings.js";
import { storeGameResultLucky7B } from "../../games/common/storeGameResult.js";
import { endGameLucky7B } from "../../games/common/endGame.js";
import { getBetMultiplierLucky7B } from "../../games/common/getBetMultiplier.js"; 
import BaseGame from "../shared/config/base_game.js";
import redis from "../../config/redis.js";
import { GAME_STATES } from "../shared/config/types.js";


class Lucky7BGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.blindCard = null;
    this.secondCard = null;
    this.bettingResults = {
      low: [],
      high: [],
      mid: [],
      even: [],
      odd: [],
      black: [],
      red: [],
    };
    this.players = new Map();
    this.winner = null;
    this.BETTING_PHASE_DURATION = 20000;
    this.CARD_DEAL_DURATION = 3000;
    this.gameInterval = null;
  }

  collectCards(playerSide) {
    return collectCardsLucky7B(this, playerSide);
  }

  /*logSpecificGameState() {
    logSpecificGameState(this.blindCard, this.secondCard);
  }*/

    async saveState() {
      await saveStateLucky7B(
        this.gameId,
        this.blindCard,
        this.secondCard,
        this.bettingResults,
        this.winner,
        () => super.saveState()
      );
    }

  async recoverState() {
    const state = await recoverStateLucky7B(this.gameId, () => super.recoverState());
    if (state) {
      this.blindCard = state.blindCard;
      this.secondCard = state.secondCard;
      this.bettingResults = state.bettingResults;
      this.winner = state.winner;
    }
  }

  async start() {
    await startLucky7B(this);
  }

  async startDealing() {
    await startDealingLucky7B(this);
  }

  async revealCards() {
    await revealCards(this);
  }

  async calculateResult() {
    return await calculateResult(this);
  }

  async distributeWinnings(resultCategory) {
    await distributeWinnings(this, resultCategory);
  }

  async storeGameResult() {
    await storeGameResultLucky7B(this);
  }

  async endGame() {
    await endGameLucky7B(this);
  }

  async getBetMultiplier(betSide) {
    return getBetMultiplierLucky7B(betSide);
  }
}

export default Lucky7BGame;
