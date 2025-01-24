import { collectCards } from "../../games/common/collectCards.js";
import { saveState } from "../../games/common/saveState.js";
import { recoverState } from "../../games/common/recoverState.js";
import { startGame } from "../../games/common/start.js";
import { startDealing } from "../../games/common/startDealing.js";
import { shuffleDeck } from "./shuffleDeck.js";
import { dealCards } from "./dealCards.js";
import { compareCards } from "./compareCards.js";
import { endGame } from "../../games/common/endGame.js";
import { storeGameResult } from "../../games/common/storeGameResult.js";
import { resetGame } from "./resetGame.js";
import { getBetMultiplier } from "../../games/common/getBetMultiplier.js";
import BaseGame from "../shared/config/base_game.js";
import { GAME_STATES } from "../shared/config/types.js";
import redis from "../../config/redis.js";

class AndarBaharGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.jokerCard = null;
    this.andarCards = [];
    this.baharCards = [];
    this.betSides = ["Andar", "Bahar"];
    this.winner = null;
    this.status = GAME_STATES.WAITING;
    this.BETTING_PHASE_DURATION = 2000; // Example value
    this.CARD_DEAL_INTERVAL = 300; // Example value
  }

collectCards(playerSide) {
    return collectCards("AndarBahar", this, playerSide);
}

async saveState() {
  await saveState("AndarBahar", this, () => super.saveState());
}

  async recoverState() {
    const state = await recoverState("AndarBahar", this.gameId, () => super.recoverState());
    if (state) {
      this.jokerCard = state.jokerCard;
      this.andarCards = state.andarCards;
      this.baharCards = state.baharCards;
    }
  }

  async start() {
    await startGame("AndarBahar", this);
  }

  async startDealing() {
    await startDealing("AndarBahar", this);
  }

  async shuffleDeck(deck) {
    return await shuffleDeck(deck, this.gameId, this.jokerCard);
  }

  async dealCards() {
    await dealCards(this);
  //   await this.processGameStateVideo();
  }

  compareCards(card1, card2) {
    return compareCards(card1, card2);
  }

  async endGame() {
    this.status = GAME_STATES.COMPLETED;
    await endGame("AndarBahar", this);
}

async storeGameResult() {
  await storeGameResult("AndarBahar", this);
}


  resetGame() {
    resetGame(this);
  }

  logSpecificGameState() {
    console.log("Joker Card:", this.jokerCard);
    console.log("Andar Cards:", this.andarCards.join(", "));
    console.log("Bahar Cards:", this.baharCards.join(", "));
  }

    async getBetMultiplier(betSide) {
      return await getBetMultiplier("AndarBahar", betSide);
  }
}

export default AndarBaharGame;
