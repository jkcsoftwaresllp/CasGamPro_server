import BaseGame from "../shared/config/base_game.js";
import { GAME_TYPES } from "../shared/config/types.js";
import { findLeastBetCategory, determineWinningCategory, narrowDownCards, selectRandomCard, } from "./helper.js";

export default class Lucky7BGame extends BaseGame {
  constructor(roundId) {
    super(roundId);
    this.gameType = GAME_TYPES.LUCKY7B; //workaround for now
    this.blindCard = null;
    this.secondCard = null;
    this.real_winner = null; //talk about workarounds
    this.bettingResults = {
      low: [],
      high: [],
      mid: [],
      even: [],
      odd: [],
      black: [],
      red: [],
    };
    this.players = {
      A: [],  // LOW
      B: [], // HIGH
    }
    this.playersBet = new Map();
    //this.winner = null;
    this.winner = [];
    this.BETTING_PHASE_DURATION = 2000;
    this.CARD_DEAL_DURATION = 3000;
    this.gameInterval = null;
    this.betSides = ["low", "high", "mid", "odd", "even", "black", "red"]; // add more if need be.
  }

  async firstServe() {
    this.blindCard = this.deck.shift();
  }

  determineOutcome(bets) {
    const categories = {
      lowMidHigh: ["low", "mid", "high"],
      evenOdd: ["even", "odd"],
      blackRed: ["black", "red"],
    };

    const leastBets = {
      lowMidHigh: findLeastBetCategory(categories.lowMidHigh, bets),
      evenOdd: findLeastBetCategory(categories.evenOdd, bets),
      blackRed: findLeastBetCategory(categories.blackRed, bets),
    };

    const narrowedCards = narrowDownCards(leastBets);
    const selectedCard = selectRandomCard(narrowedCards);

    const suits = ["S", "H", "C", "D"];
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const deck = suits.flatMap(suit => ranks.map(rank => `${suit}${rank}`));

    let blindCard;
    do {
      blindCard = selectRandomCard(deck);
    } while (narrowedCards.includes(blindCard));


    // this.winner = determineWinningCategory(selectedCard);
    //this.secondCard = selectedCard;
    //this.winner = this.secondCard;

    this.blindCard = blindCard;  // Blind card is chosen first
    this.secondCard = selectedCard;     // Second card is the deciding card
    // Log cards before declaring the winner
    this.logGameState("Cards Revealed");

    // Set the winner array with multiple categories
    this.winner = [
      ...determineWinningCategory(this.secondCard),
    ];

    // Log the winner after determining categories
    this.logGameState("Winner Determined");

    // Assign to playerA (LOW) or playerB (HIGH)
    const rank = selectedCard.slice(1);
    const numRank = isNaN(parseInt(rank))
      ? rank === "A"
        ? 1
        : rank === "J"
          ? 11
          : rank === "Q"
            ? 12
            : rank === "K"
              ? 13
              : 7
      : parseInt(rank);

    if (numRank < 7) {
      this.players.A = [selectedCard];
      this.players.B = [];
    } else if (numRank > 7) {
      this.players.A = [];
      this.players.B = [selectedCard];
    } else {
      // For 7, neither side gets the card
      this.players.A = [];
      this.players.B = [];
    }
  }
}
