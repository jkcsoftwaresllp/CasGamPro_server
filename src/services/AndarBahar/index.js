import { collectCardsAndarBahar } from "../../games/common/collectCards.js";
import { saveStateAndarBahar } from "../../games/common/saveState.js";
import { recoverStateAndarBahar } from "../../games/common/recoverState.js";
import { startAndarBahar } from "../../games/common/start.js";
import { startDealingAndarBahar } from "../../games/common/startDealing.js";
import { shuffleDeck } from "./shuffleDeck.js";
import { dealCards } from "./dealCards.js";
import { compareCards } from "./compareCards.js";
import { endGameAndarBahar } from "../../games/common/endGame.js";
import { storeGameResultAndarBahar } from "../../games/common/storeGameResult.js";
import { resetGame } from "./resetGame.js";
import { getBetMultiplierAndarBahar } from "../../games/common/getBetMultiplier.js"; 
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
    this.BETTING_PHASE_DURATION = 20000; // Example value
    this.CARD_DEAL_INTERVAL = 3000; // Example value
  }

  collectCards(playerSide) {
    return collectCardsAndarBahar(playerSide, this.andarCards, this.baharCards);
  }

  async saveState() {
    await saveStateAndarBahar(
      this.gameId,
      this.jokerCard,
      this.andarCards,
      this.baharCards,
      () => super.saveState()
    );
  }

  async recoverState() {
    const state = await recoverStateAndarBahar(this.gameId, () => super.recoverState());
    if (state) {
      this.jokerCard = state.jokerCard;
      this.andarCards = state.andarCards;
      this.baharCards = state.baharCards;
    }
  }

  async start() {
    await startAndarBahar(this);
  }

  async startDealing() {
    await startDealingAndarBahar(this);
  }

  async shuffleDeck(deck) {
    return await shuffleDeck(deck, this.gameId, this.jokerCard);
  }

  async dealCards() {
    await dealCards(this);
  }

  compareCards(card1, card2) {
    return compareCards(card1, card2);
  }

  async endGame() {
    this.status = GAME_STATES.COMPLETED;
    await endGameAndarBahar(this);
  }

  async storeGameResult() {
    await storeGameResultAndarBahar(this);
  }
  

  resetGame() {
    resetGame(this);
  }

  /*logSpecificGameState() {
    logSpecificGameState(this.jokerCard, this.andarCards, this.baharCards);
  }*/

  async getBetMultiplier(betSide) {
    return await getBetMultiplierAndarBahar(betSide);
  }
}

export default AndarBaharGame;
