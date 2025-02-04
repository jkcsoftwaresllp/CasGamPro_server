import { GAME_STATES, GAME_TYPES } from "../shared/config/types.js";

import {
  findLeastBetCategory,
  determineWinningCategory,
  narrowDownCards,
  selectRandomCard,
} from "./helper.js";

export async function determineOutcome(bets) {
  // console.log('determineOutcome', bets)
  // console.log("determineOutcome");

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
    this.playerA = [selectedCard];
    this.playerB = [];
  } else if (numRank > 7) {
    this.playerA = [];
    this.playerB = [selectedCard];
  } else {
    // For 7, neither side gets the card
    this.playerA = [];
    this.playerB = [];
  }
}

export async function distributeWinnings() {
  return; // TODO: FIX THIS
  const resultCategory = this.winner;

  for (let [playerId, betDetails] of this.players) {
    if (betDetails.category === resultCategory) {
      this.players.get(playerId).balance +=
        betDetails.amount * this.getBetProfitPercentage(resultCategory);
    } else {
      this.players.get(playerId).balance -= betDetails.amount;
    }
  }

  this.logGameState(`Winnings Distributed`);
}

export async function revealCards() {
  this.status = GAME_STATES.COMPLETED;
  //this.winner = this.secondCard;
  await this.saveState();

  this.logGameState("Cards Revealed");
  // await gameInstance.distributeWinnings(result); // Uncomment this if needed
  await this.endGame();
}
