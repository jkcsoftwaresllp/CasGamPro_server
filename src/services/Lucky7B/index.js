import { collectCards } from "../../games/common/collectCards.js";
import { recoverState } from "../../games/common/recoverState.js";
import { startGame } from "../../games/common/start.js";
import { startDealing } from "../../games/common/startDealing.js";
import { storeGameResult } from "../../games/common/storeGameResult.js";
import { endGame } from "../../games/common/endGame.js";
import { getBetMultiplier } from "../../games/common/getBetMultiplier.js";
import BaseGame from "../shared/config/base_game.js";
import redis from "../../config/redis.js";
import { GAME_STATES, GAME_TYPES } from "../shared/config/types.js";
import { determineOutcome, distributeWinnings, revealCards } from "./methods.js";

export default class Lucky7BGame extends BaseGame {
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
    this.playerA = []; // LOW
    this.playerB = []; // HIGH
    this.players = new Map();
    this.winner = null;
    this.BETTING_PHASE_DURATION = 20000;
    this.CARD_DEAL_DURATION = 3000;
    this.gameInterval = null;
    this.betSides = ["low", "high"]; // add more if need be.
  }

  logSpecificGameState() {
    // TODO: implement
  }

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
  }};

Lucky7BGame.prototype.start = startGame;
Lucky7BGame.prototype.startDealing = startDealing;
Lucky7BGame.prototype.endGame = endGame;
Lucky7BGame.prototype.storeGameResult = storeGameResult;
Lucky7BGame.prototype.revealCards = revealCards;
Lucky7BGame.prototype.getBetMultiplier = getBetMultiplier;
Lucky7BGame.prototype.distributeWinnings = distributeWinnings;
Lucky7BGame.prototype.determineOutcome = determineOutcome;
