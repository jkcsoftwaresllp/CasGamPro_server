import { collectCards } from "../../games/common/collectCards.js";
import { recoverState } from "../../games/common/recoverState.js";
import { startGame } from "../../games/common/start.js";
import { startDealing } from "../../games/common/startDealing.js";
import { storeGameResult } from "../../games/common/storeGameResult.js";
import { endGame } from "../../games/common/endGame.js";
import { getBetMultiplier } from "../../games/common/getBetMultiplier.js";
import BaseGame from "../shared/config/base_game.js";
import { GAME_STATES, GAME_TYPES } from "../shared/config/types.js";
import { generateLosingHand, generateWinningHand, distributeWinnings, determineWinner } from "./methods.js"

export default class TeenPattiGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.gameType = GAME_TYPES.TEEN_PATTI; //workaround for now
    this.blindCard = null;
    this.playerA = [];
    this.playerB = [];
    this.bettingResults = {
      player1: [],
      player2: [],
    };
    this.winner = null;
    this.BETTING_PHASE_DURATION = 30000; // 30 seconds for betting
    this.CARD_DEAL_DURATION = 5000; // 5 seconds for dealing
    this.betSides = ["playerA", "playerB"];
    this.gameInterval = null;
  }

  async saveState() {
    await super.saveState();
  }


  async recoverState() {
    const state = await recoverState("TeenPatti", this.gameId, () =>
      super.recoverState(),
    );
    if (state) {
      this.blindCard = state.blindCard;
      this.playerA = state.playerA;
      this.playerB = state.playerB;
      this.bettingResults = state.bettingResults;
      this.winner = state.winner;
    }
  }

  logGameState(event) {
    return;
    console.log(`\n=== ${this.gameId} - ${event} ===`);
    console.log("Type: TeenPatti");
    console.log("Status:", this.status);
    console.log("Blind Card:", this.blindCard);
    //console.log("Player 1 Cards:", this.player1Cards);
    console.log(
      "Player A:",
      this.status === "dealing" ? null : this.playerA,
    );
    //console.log("Player 2 Cards:", this.player2Cards);
    console.log(
      "Player B:",
      this.status === "dealing" ? null : this.playerB,
    );
    console.log("Winner:", this.winner);
    console.log("Time:", new Date().toLocaleTimeString());
    console.log("===============================\n");
  }

  async determineOutcome(bets) {
    const playerATotal = bets.playerA || 0;
    const playerBTotal = bets.playerB || 0;

    const winningPlayer = playerATotal <= playerBTotal ? "playerA" : "playerB";
    const winningHand = generateWinningHand(this.deck);
    const losingHand = generateLosingHand(this.deck, winningHand);

    // console.log("winner:", winningPlayer)
    this.winner = winningPlayer;
    // console.log("winner:", this.winner)


    if (winningPlayer === "playerA") {
      this.playerA = winningHand;
      this.playerB = losingHand;
    } else {
      this.playerA = losingHand;
      this.playerB = winningHand;
    }
  }
}

TeenPattiGame.prototype.start = startGame;
TeenPattiGame.prototype.startDealing = startDealing;
TeenPattiGame.prototype.determineWinner = determineWinner;
// calculate result already in base game
TeenPattiGame.prototype.distributeWinnings = distributeWinnings;
TeenPattiGame.prototype.endGame = endGame;
TeenPattiGame.prototype.storeGameResult = storeGameResult;
TeenPattiGame.prototype.getBetMultiplier = function(side) {
  return getBetMultiplier(this.gameType, this.bettingResults[side]);
}
