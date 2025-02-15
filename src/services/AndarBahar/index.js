import BaseGame from "../shared/config/base_game.js";
import {
  GAME_CONFIGS,
  GAME_STATES,
  GAME_TYPES,
} from "../shared/config/types.js";
import { getMinValueKeys } from "../shared/helper/getMinValueKeys.js";
import {
  initializeBetTotals,
  findLeastBetSide,
  handleCardDistribution,
} from "./helper.js";

const GAME_INDEX = 4;

export default class AndarBaharGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    this.gameType = GAME_CONFIGS[GAME_INDEX].type;
    this.jokerCard = null;
    this.players = {
      A: [],
      B: [],
    };
    this.betSides = GAME_CONFIGS[GAME_INDEX].betOptions;
    this.winner = null;
    this.status = GAME_STATES.WAITING;
    this.BETTING_PHASE_DURATION = GAME_CONFIGS[GAME_INDEX].bettingDuration;
    this.CARD_DEAL_INTERVAL = GAME_CONFIGS[GAME_INDEX].cardDealInterval;

  }

  async firstServe() {
    this.currentRoundCards = [];
    this.winner = null;
  }

  determineOutcome(bets) {
    const leastBetSide = findLeastBetSide(bets);

    let distributedCards = handleCardDistribution(leastBetSide, betTotals);

    this.winner = leastBetSide;
    this.currentRoundCards = distributedCards;

    this.players.A = distributedCards.filter((card) => card.startsWith("A"));
    this.players.B = distributedCards.filter((card) => card.startsWith("B"));
  }
}
