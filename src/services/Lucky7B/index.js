import BaseGame from "../shared/config/base_game.js";
import redis from "../../config/redis.js";
import { GAME_STATES, GAME_TYPES } from "../shared/config/types.js";
import gameManager from "../shared/config/manager.js";

class Lucky7BGame extends BaseGame {
	constructor(gameId) {
		super(gameId);
		this.blindCard = null;
		this.secondCard = null;
		this.bettingResults = {
			low: [],
			high: [],
			mid: [],
			even: [],
			odd: [],
			black: [],
			red: [],
		};
		this.players = new Map();
		this.winner = null;
		this.BETTING_PHASE_DURATION = 20000;
		this.CARD_DEAL_DURATION = 3000;
		this.gameInterval = null;
	}

	// Lucky7BGame
	async getBetMultiplier(betSide) {
		const multipliers = {
			low: 1.96,
			high: 1.96,
			mid: 2.0,
			even: 2.1,
			odd: 1.79,
			black: 1.95,
			red: 1.95,
		};
		return multipliers[betSide] || 1;
	}

	getValidBetOptions() {
		return ["low", "high", "mid", "even", "odd", "black", "red"];
	}

	logSpecificGameState() {
		console.log("Danishan: Lucky7BGame.js");

		// console.log("Blind Card:", this.blindCard);
		// console.log("Second Card:", this.secondCard);
	}

	async saveState() {
		try {
			await super.saveState();
			await redis.hmset(`game:${this.gameId}:lucky7b`, {
				blindCard: this.blindCard ? JSON.stringify(this.blindCard) : "",
				secondCard: this.secondCard
					? JSON.stringify(this.secondCard)
					: "",
				bettingResults: JSON.stringify(this.bettingResults),
				winner: this.winner || "",
			});
		} catch (error) {
			console.error(
				`Failed to save Lucky7B state for ${this.gameId}:`,
				error,
			);
		}
	}

	async recoverState() {
		try {
			await super.recoverState();
			const state = await redis.hgetall(`game:${this.gameId}:lucky7b`);
			if (state && Object.keys(state).length) {
				this.blindCard = state.blindCard
					? JSON.parse(state.blindCard)
					: null;
				this.secondCard = state.secondCard
					? JSON.parse(state.secondCard)
					: null;
				this.bettingResults = state.bettingResults
					? JSON.parse(state.bettingResults)
					: {};
				this.winner = state.winner || null;
			}
		} catch (error) {
			console.error(
				`Failed to recover Lucky7B state for ${this.gameId}:`,
				error,
			);
		}
	}

	async start() {
		this.status = GAME_STATES.BETTING;
		this.startTime = Date.now();
		await this.saveState();

		this.logGameState("Game Started - Betting Phase");

		this.gameInterval = setTimeout(async () => {
			await this.startDealing();
		}, this.BETTING_PHASE_DURATION);
	}

	async startDealing() {
		this.status = GAME_STATES.DEALING;
		this.blindCard = this.deck.shift();
		this.secondCard = this.deck.shift();
		await this.saveState();

		this.logGameState("Dealing Phase Started");

		setTimeout(async () => {
			await this.revealCards();
		}, this.CARD_DEAL_DURATION);
	}

	async revealCards() {
		const result = this.calculateResult();
		this.status = GAME_STATES.COMPLETED;
		this.winner = result;
		await this.saveState();

		this.logGameState("Cards Revealed");

		await this.distributeWinnings(result);
		await this.endGame();
	}

	async calculateResult() {
		// Step 1: Calculate the least bet category in each group
		const categoryBets = {
			low: this.bettingResults.low.length,
			high: this.bettingResults.high.length,
			mid: this.bettingResults.mid.length,
			even: this.bettingResults.even.length,
			odd: this.bettingResults.odd.length,
			black: this.bettingResults.black.length,
			red: this.bettingResults.red.length,
		};

		const lowMidHigh = ["low", "mid", "high"];
		const evenOdd = ["even", "odd"];
		const blackRed = ["black", "red"];

		// Find the category with the least bets in each group
		const leastLowMidHigh = lowMidHigh.reduce((min, category) =>
			categoryBets[category] < categoryBets[min] ? category : min,
		);
		const leastEvenOdd = evenOdd.reduce((min, category) =>
			categoryBets[category] < categoryBets[min] ? category : min,
		);
		const leastBlackRed = blackRed.reduce((min, category) =>
			categoryBets[category] < categoryBets[min] ? category : min,
		);

		// Step 2: Narrow down based on categories with the least bets
		let narrowedDownCards = [];

		if (leastEvenOdd === "even") {
			narrowedDownCards = ["2", "4", "6", "8", "10"];
		} else if (leastEvenOdd === "odd") {
			narrowedDownCards = ["3", "5", "7", "9"];
		}

		if (leastBlackRed === "black") {
			narrowedDownCards = narrowedDownCards
				.filter((card) =>
					[
						"2",
						"3",
						"4",
						"5",
						"6",
						"7",
						"8",
						"9",
						"10",
						"J",
						"Q",
						"K",
						"Ace",
					].includes(card),
				)
				.map((card) => [`${card}♠`, `${card}♣`])
				.flat();
		} else if (leastBlackRed === "red") {
			narrowedDownCards = narrowedDownCards
				.filter((card) =>
					[
						"2",
						"3",
						"4",
						"5",
						"6",
						"7",
						"8",
						"9",
						"10",
						"J",
						"Q",
						"K",
						"Ace",
					].includes(card),
				)
				.map((card) => [`${card}♥`, `${card}♦`])
				.flat();
		}

		if (leastLowMidHigh === "high") {
			narrowedDownCards = narrowedDownCards.filter((card) =>
				["8", "10", "J", "Q", "K", "Ace"].some((highCard) =>
					card.includes(highCard),
				),
			);
		} else if (leastLowMidHigh === "low") {
			narrowedDownCards = narrowedDownCards.filter((card) =>
				["Ace", "2", "3", "4", "5", "6"].includes(card.split("")[0]),
			);
		} else if (leastLowMidHigh === "mid") {
			narrowedDownCards = narrowedDownCards.filter((card) =>
				["7"].includes(card.split("")[0]),
			);
		}

		// Step 3: Randomly select a card from the narrowed down set
		const winningCard =
			narrowedDownCards[
				Math.floor(Math.random() * narrowedDownCards.length)
			];

		return winningCard;
	}

	async distributeWinnings(resultCategory) {
		let winningCards = [];
		if (resultCategory === "low") {
			winningCards.push(this.blindCard, this.secondCard);
		} else if (resultCategory === "high") {
			winningCards.push(this.blindCard, this.secondCard);
		} else if (resultCategory === "mid") {
			winningCards.push(this.secondCard);
		}

		for (let [playerId, betDetails] of this.players) {
			if (betDetails.category === resultCategory) {
				this.players.get(playerId).balance +=
					betDetails.amount *
					this.getBetProfitPercentage(resultCategory);
			} else {
				this.players.get(playerId).balance -= betDetails.amount;
			}
		}

		this.logGameState(
			`Winnings Distributed (Winning Cards: ${winningCards.map((card) => card.rank + " of " + card.suit).join(", ")})`,
		);
	}

	getBetProfitPercentage(category) {
		const profitPercentages = {
			low: 1.96,
			high: 1.96,
			mid: 2.0,
			even: 2.1,
			odd: 1.79,
			black: 1.95,
			red: 1.95,
		};

		return profitPercentages[category] || 1;
	}

	async storeGameResult() {
		try {
			const result = {
				gameId: this.gameId,
				winner: this.winner,
				blindCard: this.blindCard,
				secondCard: this.secondCard,
				bettingResults: this.bettingResults,
				timestamp: Date.now(),
			};

			await redis.lpush("game_history", JSON.stringify(result));
			await redis.ltrim("game_history", 0, 99);
		} catch (error) {
			console.error(
				`Failed to store game result for ${this.gameId}:`,
				error,
			);
		}
	}

	async endGame() {
		this.status = GAME_STATES.COMPLETED;
		await this.saveState();

		await this.storeGameResult();

		this.logGameState("Game Completed");

		setTimeout(async () => {
			try {
				await this.clearState();

				const newGame = await gameManager.startNewGame(
					GAME_TYPES.LUCKY7B,
				);
				gameManager.activeGames.delete(this.gameId);
				await newGame.start();
			} catch (error) {
				console.error("Failed to start new game:", error);
			}
		}, 5000);
	}
}

export default Lucky7BGame;
