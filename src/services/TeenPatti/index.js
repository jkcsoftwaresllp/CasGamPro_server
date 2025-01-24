import { collectCards } from "../../games/common/collectCards.js";
import { saveState } from "../../games/common/saveState.js";
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
import { GAME_STATES } from "../shared/config/types.js";

class TeenPattiGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.blindCard = null;
    this.player1Cards = [];
    this.player2Cards = [];
    this.bettingResults = {
      player1: [],
      player2: [],
    };
    this.winner = null;
    this.BETTING_PHASE_DURATION = 30000; // 30 seconds for betting
    this.CARD_DEAL_DURATION = 5000; // 5 seconds for dealing
    this.betSides = ["player1", "player2"];
    this.gameInterval = null;
  }

  collectCards(playerSide) {
    return collectCards("TeenPatti", this, playerSide);
  }

  async saveState() {
    await saveState("TeenPatti", this, () => super.saveState());
  }

  async recoverState() {
    const state = await recoverState("TeenPatti", this.gameId, () =>
      super.recoverState()
    );
    if (state) {
      this.blindCard = state.blindCard;
      this.player1Cards = state.player1Cards;
      this.player2Cards = state.player2Cards;
      this.bettingResults = state.bettingResults;
      this.winner = state.winner;
    }
  }

  async start() {
    await startGame("TeenPatti", this);
  }

  async startDealing() {
    await startDealing("TeenPatti", this);
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

  async storeGameResult() {
    await storeGameResult("TeenPatti", this);
  }

  async endGame() {
    await endGame("TeenPatti", this);
  }

  async getBetMultiplier(betSide) {
    return await getBetMultiplier("TeenPatti", betSide);
  }

  logGameState(event) {
    return;
    console.log(`\n=== ${this.gameId} - ${event} ===`);
    console.log("Type: TeenPatti");
    console.log("Status:", this.status);
    console.log("Blind Card:", this.blindCard);
    //console.log("Player 1 Cards:", this.player1Cards);
    console.log(
      "Player 1 Cards:",
      this.status === "dealing" ? null : this.player1Cards
    );
    //console.log("Player 2 Cards:", this.player2Cards);
    console.log(
      "Player 2 Cards:",
      this.status === "dealing" ? null : this.player2Cards
    );
    console.log("Winner:", this.winner);
    console.log("Time:", new Date().toLocaleTimeString());
    console.log("===============================\n");
  }
}

export default TeenPattiGame;
