import BaseGame from "../shared/config/base_game.js";
import { GAME_STATES, GAME_TYPES } from "../shared/config/types.js";
import {
  initializeBetTotals,
  findLeastBetSide,
  handleCardDistribution,
} from "./helper.js";

export default class AndarBaharGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    this.gameType = GAME_TYPES.ANDAR_BAHAR; //workaround for now
    this.jokerCard = null;
    this.players = {
      A: [],
      B: [],
    };
    this.betSides = ["Andar", "Bahar"];
    this.winner = null;
    this.status = GAME_STATES.WAITING;
    this.BETTING_PHASE_DURATION = 2000; // Example value
    this.CARD_DEAL_INTERVAL = 3000; // Example value
  }

  async firstServe() {
    this.currentRoundCards = [];
    this.winner = null;
  }

  determineOutcome(bets) {
    const betTotals = initializeBetTotals(bets);
    const leastBetSide = findLeastBetSide(betTotals);

    let distributedCards = handleCardDistribution(leastBetSide, betTotals);

    this.winner = leastBetSide;
    this.currentRoundCards = distributedCards;

    this.players.A = distributedCards.filter((card) => card.startsWith("A"));
    this.players.B = distributedCards.filter((card) => card.startsWith("B"));
  }
}
