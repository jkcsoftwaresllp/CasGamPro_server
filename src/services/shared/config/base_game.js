import { GAME_STATES } from "./types.js";
import { initializeDeck } from "../helper/deckHelper.js";
import { placeBet } from "../helper/betHelper.js";
import { logger } from "../../../logger/logger.js";
import VideoProcessor from "../../VAT/index.js";
import {
	broadcastVideoComplete,
	broadcastVideoProgress,
	processGameStateVideo,
} from "../helper/unixHelper.js";
import { broadcastGameState } from "./handler.js";
import { aggregateBets } from "../helper/resultHelper.js";
import gameManager from "./manager.js";

export default class BaseGame {
	constructor(roundId) {
		this.roundId = roundId; // TODO: Make this shorter
		this.status = GAME_STATES.WAITING;
		this.startTime = null;
		this.winner = null;
		this.deck = initializeDeck();
		this.jokerCard = null;
		this.blindCard = null;
		this.players = {
			A: [],
			B: [],
			C: [],
		};
		this.cards = [];
		this.gameType = null; // why was this initialized with an array here?
		this.gameInterval = null;
		this.BETTING_PHASE_DURATION = 30000; // default time if not provided 30s
		this.CARD_DEAL_INTERVAL = 500;

		this.videoProcessor = new VideoProcessor();
		this.videoState = {
			processing: false,
			progress: 0,
			outputPath: null,
		};

		this.bets = new Map(); // Add this to track bets
		this.betSides = [];
	}

	start() {
		this.status = GAME_STATES.BETTING;
		this.startTime = Date.now();
		this.broadcastGameState();

		this.gameInterval = setTimeout(async () => {
			await this.dealing();
		}, this.BETTING_PHASE_DURATION);
	}

	end() {
		this.status = GAME_STATES.COMPLETED;
		this.real_winner = this.winner;
		this.broadcastGameState();

		// this.logGameState("Game Completed");

		this.status = GAME_STATES.WAITING;
		setTimeout(async () => {
			try {
				const newGame = await gameManager.startNewGame(this.gameType);
				gameManager.activeGames.delete(this.roundId);
				await newGame.start();
			} catch (error) {
				console.error("Failed to start new game:", error);
			}
		}, 5000);
	}

	async dealing() {
		// comes after betting
		this.status = GAME_STATES.DEALING;

		try {
			// set joker card / blind card
			await this.firstServe();

			// set player and winner
			const bets = await aggregateBets(this.roundId);
			this.determineOutcome(bets);

			// change state, broadcast for the last time, and reset the game.
			setTimeout(async () => {
				this.end();
			}, this.CARD_DEAL_DURATION);
		} catch (err) {
			logger.error(`Failed to start dealing for ${this.gameType}:`, err);
		}
	}

	getGameState() {
		return {
			gameType: this.gameType,
			roundId: this.roundId,
			status: this.status,
			cards: {
				jokerCard: this.jokerCard || null,
				blindCard: this.blindCard || null,
				playerA: this.players.A || [],
				playerB: this.players.B || [],
				playerC: this.players.C || [],
			},
			winner: this.winner,
			startTime: this.startTime,
		};
	}

	logGameState() {
		const gameState = this.getGameState();
		const logPath = `gameLogs/${gameState.gameType}`;

		const printible = {
			infor: `${gameState.roundId}: ${gameState.gameType} | ${
				gameState.status || "-"
			} | ${gameState.winner || "-"}`,
			cards: `J : ${gameState.cards.jokerCard || "-"} | B: ${
				gameState.cards.blindCard || "-"
			} `,
			playerA: gameState.cards.playerA.join(", ") || "-",
			playerB: gameState.cards.playerB.join(", ") || "-",
			playerC: gameState.cards.playerC.join(", ") || "-",
		};

		if (Object.values(GAME_TYPES).includes(gameState.gameType)) {
			folderLogger(logPath, gameState.gameType).info(
				JSON.stringify(printible, null, 2)
			);
		}
	}

	resetGame() {
		//TODO: verify this function
		this.jokerCard = null;
		this.players.A = [];
		this.players.B = [];
		this.players.C = [];
		this.winner = null;
		this.real_winner = null;
		this.status = null;
		this.deck = this.initializeDeck();

		//additional values
		this.bets = new Map(); // Add this to track bets
	}

	// Abstract methods to be implemented by each game
	determineOutcome(bets = {}) {
		throw new Error(`determineOutcome must be implemented ${bets}`);
	}
}

// 	BET HELPER
BaseGame.prototype.placeBet = placeBet;

// UNIX SOCKETS
BaseGame.prototype.processGameStateVideo = processGameStateVideo;
BaseGame.prototype.broadcastVideoProgress = broadcastVideoProgress;
BaseGame.prototype.broadcastVideoComplete = broadcastVideoComplete;

// GAME SOCKETS
BaseGame.prototype.broadcastGameState = broadcastGameState;
