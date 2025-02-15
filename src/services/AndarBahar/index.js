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
import { logger } from "../../logger/logger.js"; // Import the logger

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
		const betTotals = initializeBetTotals(bets);
		console.log("Bet Totals:", betTotals);
		const leastBetSide = findLeastBetSide(betTotals);
		console.log("Least Bet Side:", leastBetSide);

		const { cardsForA, cardsForB } = handleCardDistribution(leastBetSide);

		this.winner = leastBetSide;
		this.players.A = cardsForA;
		this.players.B = cardsForB;

		console.log("Cards distributed to A:", this.players.A);
		console.log("Cards distributed to B:", this.players.B);

		this.serveCards();
	}

	serveCards() {
		let index = 0;
		const serveInterval = setInterval(() => {
			if (index >= this.currentRoundCards.length) {
				clearInterval(serveInterval);
				return;
			}

			const card = this.currentRoundCards[index];

			const side = index % 2 === 0 ? "B" : "A";

			if (side === "A") {
				this.players.A.push(card);
			} else {
				this.players.B.push(card);
			}

			console.log(`Served ${card} to ${side}`);
			index++;
		}, 3000); // Serve card every 3 seconds
	}
}
