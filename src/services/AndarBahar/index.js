// noinspection SpellCheckingInspection

import redis from "../../config/redis.js";
import gameManager from "../shared/config/manager.js";
import BaseClass from "../shared/config/base_game.js";
import { GAME_STATES, GAME_TYPES } from "../shared/config/types.js";

class AndarBaharGame extends BaseClass {
	constructor(gameId) {
		super(gameId);
		this.jokerCard = null;
		this.andarCards = [];
		this.baharCards = [];
		this.betSides = ["Andar", "Bahar"];
	}

	collectCards(playerSide) {
		switch (playerSide) {
			case "A":
				return this.andarCards;
			case "B":
				return this.baharCards;
			default:
				return [];
		}
	}

	// AndarBaharGame
	async getBetMultiplier(betSide) {
		return 1.96; // Fixed multiplier for Andar Bahar
	}

	logSpecificGameState() {
		console.log("Joker Card:", this.jokerCard);
		console.log("Andar Cards:", this.andarCards.join(", "));
		console.log("Bahar Cards:", this.baharCards.join(", "));
	}

	async saveState() {
		// TODO: Create an abstract function to store the cards in generalized format
		try {
			await super.saveState();
			await redis.hmset(`game:${this.gameId}:andarbahar`, {
				jokerCard: this.jokerCard || "",
				andarCards: JSON.stringify(this.andarCards),
				baharCards: JSON.stringify(this.baharCards),
			});
		} catch (error) {
			console.error(
				`Failed to save AndarBahar state for ${this.gameId}:`,
				error,
			);
		}
	}

	async recoverState() {
		// TODO: Create an abstract function to store the cards in generalized format
		try {
			await this.recoverState(); // Recover base state
			const state = await redis.hgetall(`game:${this.gameId}:andarbahar`);
			if (state && Object.keys(state).length) {
				this.jokerCard = state.jokerCard || null;
				this.andarCards = JSON.parse(state.andarCards);
				this.baharCards = JSON.parse(state.baharCards);
			}
		} catch (error) {
			console.error(
				`Failed to recover AndarBahar state for ${this.gameId}:`,
				error,
			);
		}
	}

	async start() {
		this.status = GAME_STATES.BETTING;
		this.startTime = Date.now();
		await super.saveState();

		this.logGameState("Game Started - Betting Phase");

		this.gameInterval = setTimeout(async () => {
			await this.startDealing();
		}, this.BETTING_PHASE_DURATION);
	}

	async startDealing() {
		this.status = GAME_STATES.DEALING;
		this.jokerCard = this.deck[0];
		this.deck = await this.shuffleDeck(this.deck);
		await super.saveState();

		this.logGameState("Dealing Phase Started");
		await this.dealCards();
	}

	async shuffleDeck(deck) {
		try {
			if (!Array.isArray(deck)) {
				console.error("Deck is not an array:", deck);
				deck = Array.from(deck); // Convert to array if possible
			}

			const bets = await redis.hgetall(`bets:${this.gameId}`);

			let andarTotal = 0;
			let baharTotal = 0;

			Object.values(bets).forEach((betData) => {
				const bet = JSON.parse(betData);
				if (bet.side === "Andar") {
					andarTotal += parseFloat(bet.amount);
				} else if (bet.side === "Bahar") {
					baharTotal += parseFloat(bet.amount);
				}
			});

			const favorSide = andarTotal > baharTotal ? "Bahar" : "Andar";

			const jokerCardIndex = deck.findIndex((card) =>
				this.compareCards(card, this.jokerCard),
			);

			const jokerCard = deck.splice(jokerCardIndex, 1)[0];

			for (let i = deck.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[deck[i], deck[j]] = [deck[j], deck[i]];
			}

			let insertPosition;
			if (favorSide === "Andar") {
				insertPosition = Math.floor(Math.random() * (deck.length / 2));
			} else {
				insertPosition =
					Math.floor(deck.length / 2) +
					Math.floor(Math.random() * (deck.length / 2));
			}

			deck.splice(insertPosition, 0, jokerCard);

			return deck;
		} catch (error) {
			console.error("Error in shuffleDeck:", error);
			return deck.sort(() => Math.random() - 0.5);
		}
	}

	resetGame() {
		this.jokerCard = null;
		this.andarCards = [];
		this.baharCards = [];
		this.winner = null;
		this.deck = this.initializeDeck();
		this.status = GAME_STATES.WAITING;
	}

	async dealCards() {
		const dealInterval = setInterval(async () => {
			if (this.winner || this.deck.length === 0) {
				clearInterval(dealInterval);
				await this.endGame();
				return;
			}

			console.log("ki:", this.deck, typeof this.deck);

			if (this.andarCards.length <= this.baharCards.length) {
				const card = this.deck.shift();
				this.andarCards.push(card);
				// Compare card value with joker card value
				if (this.compareCards(card, this.jokerCard)) {
					this.winner = "Andar";
				}
			} else {
				const card = this.deck.shift();
				this.baharCards.push(card);
				if (this.compareCards(card, this.jokerCard)) {
					this.winner = "Bahar";
				}
			}

			await super.saveState();
			this.logGameState("Card Dealt");
		}, this.CARD_DEAL_INTERVAL);
	}

	compareCards(card1, card2) {
		const getRankAndSuit = (card) => {
			const suit = card[0]; // H, D, C, S
			const rank = card.slice(1); // 2,3,4,...,10,J,Q,K,A
			return { suit, rank };
		};

		const card1Parts = getRankAndSuit(card1);
		const card2Parts = getRankAndSuit(card2);

		return (
			card1Parts.rank === card2Parts.rank &&
			card1Parts.suit === card2Parts.suit
		);
	}

	async endGame() {
		this.status = GAME_STATES.COMPLETED;
		await super.saveState();
		await this.storeGameResult();

		this.logGameState("Game Completed");

		setTimeout(async () => {
			try {
				await this.clearState();
				const newGame = await gameManager.startNewGame(
					GAME_TYPES.ANDAR_BAHAR,
				);
				gameManager.activeGames.delete(this.gameId);

				newGame.resetGame();
				await newGame.start();
			} catch (error) {
				console.error("Failed to start new game:", error);
			}
		}, 5000);
	}

	async storeGameResult() {
		try {
			const result = {
				gameId: this.gameId,
				winner: this.winner,
				jokerCard: this.jokerCard,
				andarCards: this.andarCards,
				baharCards: this.baharCards,
				timestamp: Date.now(),
			};

			await redis.lpush("game_history", JSON.stringify(result));
			await redis.ltrim("game_history", 0, 99); // Keeping last 100 games
		} catch (error) {
			console.error(
				`Failed to store game result for ${this.gameId}:`,
				error,
			);
		}
	}
}

export default AndarBaharGame;
