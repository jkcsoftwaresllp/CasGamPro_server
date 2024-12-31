// noinspection SpellCheckingInspection

import gameManager from "../share/configs/manager.js";
import BaseClass from "../share/configs/base_game.js";
import {GAME_TYPES} from "../share/configs/types.js";

class AndarBaharGame extends BaseClass {
  constructor(gameId) {
    super(gameId);
    this.jokerCard = null;
    this.andarCards = [];
    this.baharCards = [];
  }

  logSpecificGameState() {
    console.log("Joker Card:", this.jokerCard);
    console.log("Andar Cards:", this.andarCards.join(", "));
    console.log("Bahar Cards:", this.baharCards.join(", "));
  }

  start() {
    this.status = "betting";
    this.startTime = Date.now();

    this.logGameState("Game Started - Betting Phase");

    // Betting phase
    this.gameInterval = setTimeout(() => {
      this.startDealing();
    }, this.BETTING_PHASE_DURATION);
  }

  startDealing() {
    this.status = "dealing";
    this.jokerCard = this.deck.shift();

    this.logGameState("Dealing Phase Started");

    this.dealCards();
  }

  dealCards() {
    const dealInterval = setInterval(() => {
      if (this.winner) {
        clearInterval(dealInterval);
        this.endGame();
        return;
      }

      if (this.andarCards.length <= this.baharCards.length) {
        const card = this.deck.shift();
        this.andarCards.push(card);
        if (card === this.jokerCard) this.winner = "Andar";
      } else {
        const card = this.deck.shift();
        this.baharCards.push(card);
        if (card === this.jokerCard) this.winner = "Bahar";
      }

      this.logGameState("Card Dealt");
    }, this.CARD_DEAL_INTERVAL);
  }

  endGame() {
    this.status = "completed";
    this.logGameState("Game Completed");

    // Start new game after 5 seconds
    setTimeout(() => {
      const newGame = gameManager.startNewGame(GAME_TYPES.ANDAR_BAHAR);
      gameManager.activeGames.delete(this.gameId);
      newGame.start();
    }, 5000);
  }
}

export default AndarBaharGame;