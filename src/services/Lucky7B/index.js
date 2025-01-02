import BaseGame from "../shared/configs/base_game.js";
import redis from "../../config/redis.js";
import { GAME_STATES, GAME_TYPES } from "../shared/configs/types.js";
import gameManager from "../shared/configs/manager.js";

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
    this.players = new Map(); // To track player bets and balances
    this.winner = null; // Track winner of the game
    this.BETTING_PHASE_DURATION = 20000;  // 20 seconds for betting
    this.CARD_DEAL_DURATION = 3000;  // 3 seconds to reveal cards
    this.gameInterval = null; // Store game interval for restarting
  }

  // Log specific game state like blindCard, secondCard, etc.
  logSpecificGameState() {
    console.log("Blind Card:", this.blindCard);
    console.log("Second Card:", this.secondCard);
  }

  // Save game state to Redis
  async saveState() {
    try {
      await super.saveState();  // Save base state
      await redis.hmset(`game:${this.gameId}:lucky7b`, {
        blindCard: this.blindCard ? JSON.stringify(this.blindCard) : '',
        secondCard: this.secondCard ? JSON.stringify(this.secondCard) : '',
        bettingResults: JSON.stringify(this.bettingResults),
        winner: this.winner || '',
      });
    } catch (error) {
      console.error(`Failed to save Lucky7B state for ${this.gameId}:`, error);
    }
  }

  // Recover game state from Redis
  async recoverState() {
    try {
      await super.recoverState();  // Recover base state
      const state = await redis.hgetall(`game:${this.gameId}:lucky7b`);
      if (state && Object.keys(state).length) {
        this.blindCard = state.blindCard ? JSON.parse(state.blindCard) : null;
        this.secondCard = state.secondCard ? JSON.parse(state.secondCard) : null;
        this.bettingResults = state.bettingResults ? JSON.parse(state.bettingResults) : {};
        this.winner = state.winner || null;
      }
    } catch (error) {
      console.error(`Failed to recover Lucky7B state for ${this.gameId}:`, error);
    }
  }

  // Start the game and set the phase to betting
  async start() {
    this.status = GAME_STATES.BETTING;
    this.startTime = Date.now();
    await this.saveState();

    this.logGameState("Game Started - Betting Phase");

    this.gameInterval = setTimeout(async () => {
      await this.startDealing();
    }, this.BETTING_PHASE_DURATION);
  }

  // Start dealing cards to players (same as Andar Bahar, with a twist)
  async startDealing() {
    this.status = GAME_STATES.DEALING;
    this.blindCard = this.deck.shift(); // First card for low
    this.secondCard = this.deck.shift(); // Second card to be decided (could be low, high, mid)
    await this.saveState();

    this.logGameState("Dealing Phase Started");

    setTimeout(async () => {
      await this.revealCards();
    }, this.CARD_DEAL_DURATION);
  }

  // Reveal the cards and calculate the result
  async revealCards() {
    const result = this.calculateResult();
    this.status = GAME_STATES.COMPLETED;
    this.winner = result;  // Set winner based on calculated result
    await this.saveState();

    this.logGameState("Cards Revealed");

    await this.distributeWinnings(result);
    await this.endGame();
  }

  // Calculate the result based on betting distribution (same logic as Andar Bahar)
  calculateResult() {
    const categoryBets = {
      low: this.bettingResults.low.length,
      high: this.bettingResults.high.length,
      mid: this.bettingResults.mid.length,
      even: this.bettingResults.even.length,
      odd: this.bettingResults.odd.length,
      black: this.bettingResults.black.length,
      red: this.bettingResults.red.length,
    };

    // Find the category with the least bets in each group
    const lowMidHigh = ['low', 'mid', 'high'];
    const evenOdd = ['even', 'odd'];
    const blackRed = ['black', 'red'];

    const leastLowMidHigh = lowMidHigh.reduce((min, category) => 
      categoryBets[category] < categoryBets[min] ? category : min
    );

    const leastEvenOdd = evenOdd.reduce((min, category) => 
      categoryBets[category] < categoryBets[min] ? category : min
    );

    const leastBlackRed = blackRed.reduce((min, category) => 
      categoryBets[category] < categoryBets[min] ? category : min
    );

    // Randomly pick one category from each set: low/mid/high, even/odd, black/red
    const selectedCategories = [leastLowMidHigh, leastEvenOdd, leastBlackRed];
    const randomCategory = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];

    return randomCategory; // Returns the selected category for the second card
  }

  // Distribute winnings to players based on the result
  async distributeWinnings(resultCategory) {
    let winningCards = [];
    if (resultCategory === "low") {
      winningCards.push(this.blindCard, this.secondCard);
    } else if (resultCategory === "high") {
      winningCards.push(this.blindCard, this.secondCard);
    } else if (resultCategory === "mid") {
      winningCards.push(this.secondCard);
    }

    // Iterate over each player and calculate winnings/losses
    for (let [playerId, betDetails] of this.players) {
      if (betDetails.category === resultCategory) {
        this.players.get(playerId).balance += betDetails.amount * this.getBetProfitPercentage(resultCategory);
      } else {
        this.players.get(playerId).balance -= betDetails.amount;
      }
    }

    this.logGameState(`Winnings Distributed (Winning Cards: ${winningCards.map(card => card.rank + ' of ' + card.suit).join(', ')})`);
  }

  // Get the profit percentage for a given bet category
  getBetProfitPercentage(category) {
    const profitPercentages = {
      low: 1.96,
      high: 1.96,
      mid: 2.0,
      even: 2.10,
      odd: 1.79,
      black: 1.95,
      red: 1.95,
    };

    return profitPercentages[category] || 1;
  }

  // Handle placing a bet (same as Andar Bahar)
  async placeBet(playerId, betDetails) {
    if (this.status !== GAME_STATES.BETTING) {
      throw new Error("Betting is closed");
    }

    console.log(`Placing bet for player ${playerId}:`, betDetails);

    try {
      await redis.hset(
        `bets:${this.gameId}`,
        playerId,
        JSON.stringify({
          category: betDetails.category,
          amount: betDetails.amount,
          timestamp: Date.now(),
        })
      );

      // Track active bets for the player
      await redis.hincrby(`user:${playerId}:active_bets`, this.gameId, betDetails.amount);

      // Store the bet result in the appropriate category
      if (betDetails.category && this.bettingResults[betDetails.category]) {
        this.bettingResults[betDetails.category].push(betDetails);
      }
    } catch (error) {
      console.error(`Failed to place bet for player ${playerId}:`, error);
      throw new Error("Failed to place bet");
    }
  }

  // Store the game result in history in Redis (same as Andar Bahar)
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
      await redis.ltrim("game_history", 0, 99); // Keeping last 100 games
    } catch (error) {
      console.error(`Failed to store game result for ${this.gameId}:`, error);
    }
  }

  // End the game and transition to the next (loop the game as Andar Bahar)
  async endGame() {
    this.status = GAME_STATES.COMPLETED;
    await this.saveState();

    // Store game result in history in Redis
    await this.storeGameResult();

    this.logGameState("Game Completed");

    setTimeout(async () => {
      try {
        await this.clearState();
        // Start a new game after a short delay
        const newGame = await gameManager.startNewGame(GAME_TYPES.LUCKY7B);
        gameManager.activeGames.delete(this.gameId);
        await newGame.start();  // Automatically restart the game after a delay
      } catch (error) {
        console.error("Failed to start new game:", error);
      }
    }, 5000);  // Delay before starting the next game
  }
}

export default Lucky7BGame;
