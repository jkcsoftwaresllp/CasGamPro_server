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
    this.players = new Map(); 
    this.winner = null; 
    this.BETTING_PHASE_DURATION = 20000;  
    this.CARD_DEAL_DURATION = 3000;  
    this.gameInterval = null; 
  }

  logSpecificGameState() {
    console.log("Blind Card:", this.blindCard);
    console.log("Second Card:", this.secondCard);
  }

  async saveState() {
    try {
      await super.saveState();  
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

  async recoverState() {
    try {
      await super.recoverState();  
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

    const selectedCategories = [leastLowMidHigh, leastEvenOdd, leastBlackRed];
    const randomCategory = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];

    return randomCategory; 
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
        this.players.get(playerId).balance += betDetails.amount * this.getBetProfitPercentage(resultCategory);
      } else {
        this.players.get(playerId).balance -= betDetails.amount;
      }
    }

    this.logGameState(`Winnings Distributed (Winning Cards: ${winningCards.map(card => card.rank + ' of ' + card.suit).join(', ')})`);
  }

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

      await redis.hincrby(`user:${playerId}:active_bets`, this.gameId, betDetails.amount);

      if (betDetails.category && this.bettingResults[betDetails.category]) {
        this.bettingResults[betDetails.category].push(betDetails);
      }
    } catch (error) {
      console.error(`Failed to place bet for player ${playerId}:`, error);
      throw new Error("Failed to place bet");
    }
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
      console.error(`Failed to store game result for ${this.gameId}:`, error);
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
        
        const newGame = await gameManager.startNewGame(GAME_TYPES.LUCKY7B);
        gameManager.activeGames.delete(this.gameId);
        await newGame.start();  
      } catch (error) {
        console.error("Failed to start new game:", error);
      }
    }, 5000);  
  }
}

export default Lucky7BGame;