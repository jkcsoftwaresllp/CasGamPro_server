import { collectCards } from "../../games/common/collectCards.js";
import { recoverState } from "../../games/common/recoverState.js";
import { startGame } from "../../games/common/start.js";
import { startDealing } from "../../games/common/startDealing.js";
import { determineWinner } from "./determineWinner.js";
import { distributeWinnings } from "./distributeWinnings.js";
import { calculateResult } from "./calculateResult.js";
import { storeGameResult } from "../../games/common/storeGameResult.js";
import { endGame } from "../../games/common/endGame.js";
import { getBetMultiplier } from "../../games/common/getBetMultiplier.js";
import BaseGame from "../shared/config/base_game.js";
import { GAME_STATES, GAME_TYPES } from "../shared/config/types.js";

export default class DragonTigerGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.gameType = GAME_TYPES.DRAGON_TIGER; //workaround for now
    this.dragonCard = null;
    this.tigerCard = null;
    this.bettingResults = {
      dragon: [],
      tiger: [],
      tie: [],
      pair: [],
      odd: [],
      even: [],
      black: [],
      red: [],
      specificCard: [],
    };
    this.winner = null;
    this.BETTING_PHASE_DURATION = 20000;
    this.CARD_DEAL_DURATION = 3000;
    this.betSides = [
      "dragon",
      "tiger",
      "tie",
      "pair",
      "odd",
      "even",
      "black",
      "red",
      "specificCard",
    ];
    this.gameInterval = null;
  }

  collectCards(playerSide) {
    return collectCards("DragonTiger", this, playerSide);
  }

  async saveState() {
    await super.saveState();
  }

  async recoverState() {
    const state = await recoverState("DragonTiger", this.gameId, () =>
      super.recoverState()
    );
    if (state) {
      this.dragonCard = state.dragonCard;
      this.tigerCard = state.tigerCard;
      this.bettingResults = state.bettingResults;
      this.winner = state.winner;
    }
  }

  async determineWinner() {
    await determineWinner(this);
  }

  async distributeWinnings() {
    await distributeWinnings(this);
  }

  async calculateResult() {
    return await calculateResult(this);
  }

  async getBetMultiplier(betSide) {
    return await getBetMultiplier("DragonTiger", betSide);
  }

  logGameState(event) {
    return;
    console.log(`\n=== ${this.gameId} - ${event} ===`);
    console.log("Type: DragonTiger");
    console.log("Status:", this.status);
    console.log("Winner:", this.winner);
    //console.log("Dragon Card:", this.dragonCard);
    console.log(
      "Dragon Card:",
      this.status === "dealing" ? null : this.dragonCard
    );
    //console.log("Tiger Card:", this.tigerCard);
    console.log(
      "Tiger Card:",
      this.status === "dealing" ? null : this.tigerCard
    );
    console.log("Time:", new Date().toLocaleTimeString());
    console.log("===============================\n");
  }
}

DragonTigerGame.prototype.start = startGame;
DragonTigerGame.prototype.startDealing = startDealing;
DragonTigerGame.prototype.endGame = endGame;
DragonTigerGame.prototype.storeGameResult = storeGameResult;
