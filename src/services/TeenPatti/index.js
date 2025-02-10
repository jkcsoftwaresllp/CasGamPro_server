import BaseGame from "../shared/config/base_game.js";
import { GAME_TYPES } from "../shared/config/types.js";
import { generateLosingHand, generateWinningHand, } from "./methods.js";

export default class TeenPattiGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.gameType = GAME_TYPES.TEEN_PATTI; //workaround for now
    this.blindCard = null;
    this.players = {
      A: [],
      B: [],
    }
    this.bettingResults = {
      player1: [],
      player2: [],
    };
    this.winner = null;
    this.BETTING_PHASE_DURATION = 3000; // 30 seconds for betting
    this.CARD_DEAL_DURATION = 5000; // 5 seconds for dealing
    this.betSides = ["playerA", "playerB"];
    this.gameInterval = null;
  }

  async firstServe() {
    this.blindCard = this.deck.shift();

    // maybe unnecessary part
    for (let i = 0; i < 3; i++) {
      this.players.A.push(this.deck.shift());
      this.players.B.push(this.deck.shift());
    }
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
      this.players.A = winningHand;
      this.players.B = losingHand;
    } else {
      this.players.A = losingHand;
      this.players.B = winningHand;
    }
  }
}
