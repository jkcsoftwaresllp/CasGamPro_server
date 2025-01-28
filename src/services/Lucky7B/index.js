import { collectCards } from "../../games/common/collectCards.js";
import { recoverState } from "../../games/common/recoverState.js";
import { startGame } from "../../games/common/start.js";
import { startDealing } from "../../games/common/startDealing.js";
import { revealCards } from "./revealCards.js";
import { calculateResult } from "./calculateResult.js";
import { distributeWinnings } from "./distributeWinnings.js";
import { storeGameResult } from "../../games/common/storeGameResult.js";
import { endGame } from "../../games/common/endGame.js";
import { getBetMultiplier } from "../../games/common/getBetMultiplier.js";
import BaseGame from "../shared/config/base_game.js";
import redis from "../../config/redis.js";
import { GAME_STATES, GAME_TYPES } from "../shared/config/types.js";


class Lucky7BGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.gameType = GAME_TYPES.LUCKY7B; //workaround for now
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
    return collectCards("Lucky7B", this, playerSide);
  }

  /*logSpecificGameState() {
    logSpecificGameState(this.blindCard, this.secondCard);
  }*/

  async saveState() {
    await super.saveState();
  }


  async recoverState() {
    const state = await recoverState("Lucky7B", this.gameId, () => super.recoverState());
    if (state) {
      this.blindCard = state.blindCard;
      this.secondCard = state.secondCard;
      this.bettingResults = state.bettingResults;
      this.winner = state.winner;
    }
  }

  async start() {
    await startGame("Lucky7B", this);
  }

  async startDealing() {
    await startDealing("Lucky7B", this);
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
    await storeGameResult("Lucky7B", this);
  }

  async endGame() {

    await endGame("Lucky7B", this);

    /*this.status = GAME_STATES.COMPLETED;
    await super.saveState();

    await this.storeGameResult();

    this.logGameState("Game Completed");

    setTimeout(async () => {
      try {
        await this.clearState();

        const newGame = await gameManager.startNewGame(
          GAME_TYPES.LUCKY7B,
        );
        gameManager.activeGames.delete(this.gameId);
        await newGame.start();
      } catch (error) {
        console.error("Failed to start new game:", error);
      }
    }, 5000);*/
  }

  async getBetMultiplier(betSide) {
    return await getBetMultiplier("Lucky7B", betSide);
  }

}

export default Lucky7BGame;
