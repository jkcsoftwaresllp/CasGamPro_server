import { collectCards } from "../../games/common/collectCards.js";
import { recoverState } from "../../games/common/recoverState.js";
import { startGame } from "../../games/common/start.js";
import { startDealing } from "../../games/common/startDealing.js";
import { storeGameResult } from "../../games/common/storeGameResult.js";
import { endGame } from "../../games/common/endGame.js";
import { getBetMultiplier } from "../../games/common/getBetMultiplier.js";
import BaseGame from "../shared/config/base_game.js";
import { GAME_STATES, GAME_TYPES } from "../shared/config/types.js";
import { generateLosingHand, generateWinnerHand, distributeWinnings, determineWinner } from "./methods.js";
import { folderLogger } from "../../logger/folderLogger.js";

export default class DTLGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.gameType = GAME_TYPES.DRAGON_TIGER_LION; 
    this.blindCard = null;
    this.cards = {
      dragon: [],
      tiger: [],
      lion: []
    };
    this.bettingResults = {
      dragon: [],
      tiger: [],
      lion: []
    };
    this.winner = null;
    this.BETTING_PHASE_DURATION = 20000; 
    this.CARD_DEAL_DURATION = 5000; 
    this.betSides = ["dragon", "tiger", "lion"];
    this.gameInterval = null;
  }

  async saveState() {
    await super.saveState();
  }

  async recoverState() {
    const state = await recoverState("DragonTigerLion", this.gameId, () => super.recoverState());
    if (state) {
      this.blindCard = state.blindCard;
      this.cards = state.cards;
      this.bettingResults = state.bettingResults;
      this.winner = state.winner;
    }
  }

  logGameState(event) {
    folderLogger("game_logs/DTL", "DTL").info(
      JSON.stringify(
        {
          gameType: this.gameType,
          status: this.status,
          winner: this.winner,
          dragonCards: this.status === "dealing" ? null : this.cards.dragon,
          tigerCards: this.status === "dealing" ? null : this.cards.tiger,
          lionCards: this.status === "dealing" ? null : this.cards.lion,
        },
        null,
        2
      )
    );
  }

  async determineOutcome(bets) {
    const betResults = {
      dragon: bets.dragon || 0,
      tiger: bets.tiger || 0,
      lion: bets.lion || 0,
    };

    this.winner = Object.keys(betResults).reduce((a, b) => (betResults[a] < betResults[b] ? a : b));

    const winningHand = generateWinnerHand(this.deck, this.winner);

    const losingHands = this.betSides.filter(side => side !== this.winner).map(side => generateLosingHand(this.deck, winningHand));

    this.cards[this.winner] = winningHand;
    for (let i = 0; i < losingHands.length; i++) {
      this.cards[this.betSides[i]] = losingHands[i];
    }

    this.logGameState("Winner Determined");
    await this.distributeWinnings();
    await this.endGame();
  }
}

DTLGame.prototype.start = startGame;
DTLGame.prototype.startDealing = startDealing;
DTLGame.prototype.determineWinner = determineWinner;
DTLGame.prototype.distributeWinnings = distributeWinnings;
DTLGame.prototype.endGame = endGame;
DTLGame.prototype.storeGameResult = storeGameResult;
DTLGame.prototype.getBetMultiplier = function(side) {
  return getBetMultiplier(this.gameType, this.bettingResults[side]);
};
