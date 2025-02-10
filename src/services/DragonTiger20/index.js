import BaseGame from "../shared/config/base_game.js";
import { GAME_TYPES } from "../shared/config/types.js";
import { initializeBetTotals, findLeastBetCategory, handleDragonTigerCategory } from "./helper.js";

export default class DragonTigerGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.gameType = GAME_TYPES.DRAGON_TIGER; //workaround for now
    this.dragonCard = null;
    this.tigerCard = null;
    this.real_winner = null; //talk about workarounds
    this.blindCard = null;
    this.bettingResults = {
      dragon: [],
      tiger: [],
      tie: [],
      pair: [],
      odd: [],
      even: [],
      black: [],
      red: [],
      specificCard: [],
    };
    this.players = {
      A: [],
      B: [],
    }
    this.winner = null;
    this.BETTING_PHASE_DURATION = 2000;
    this.CARD_DEAL_DURATION = 3000;
    this.betSides = [
      "dragon",
      "tiger",
      "tie",
      "pair",
      "odd",
      "even",
      "black",
      "red",
      "specificCard",
    ];
    this.gameInterval = null;
  }

  async firstServe() {
    return;
  }


  determineOutcome(bets) {
    const betTotals = initializeBetTotals(bets);
    const leastBetCategory = findLeastBetCategory(betTotals);

    let cards = null;
    if (leastBetCategory === "pair" || leastBetCategory === "tie") {
      cards = handlePairTieCategory(leastBetCategory);
    } else {
      cards = handleDragonTigerCategory(leastBetCategory, betTotals);
    }

    this.winner = leastBetCategory;

    this.blindCard = cards.blindCard;
    this.dragonCard = cards.dragonCard;
    this.tigerCard = cards.tigerCard;

    // Assign to playerA (Dragon) and playerB (Tiger)
    this.players.A = this.dragonCard ? [this.dragonCard] : [];  // Dragon
    this.players.B = this.tigerCard ? [this.tigerCard] : [];   // Tiger
  }

}
