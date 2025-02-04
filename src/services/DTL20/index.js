import { collectCards } from "../../games/common/collectCards.js";
import { recoverState } from "../../games/common/recoverState.js";
import { startGame } from "../../games/common/start.js";
import { startDealing } from "../../games/common/startDealing.js";
import { storeGameResult } from "../../games/common/storeGameResult.js";
import { endGame } from "../../games/common/endGame.js";
import { getBetMultiplier } from "../../games/common/getBetMultiplier.js";
import BaseGame from "../shared/config/base_game.js";
import { GAME_STATES, GAME_TYPES } from "../shared/config/types.js";
import {
  generateSideCard,
  getSuitRanking,
  getRankRanking,
} from "./helper.js";
import { folderLogger } from "../../logger/folderLogger.js";

export default class DTLGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.gameType = GAME_TYPES.DTL; 
    this.blindCard = null;
    this.cards = { D: null, T: null, L: null };
    this.bets = { D: {}, T: {}, L: {} }; 
    this.winner = null;
    this.BETTING_PHASE_DURATION = 20000; 
    this.CARD_DEAL_DURATION = 3000; 
    this.gameInterval = null;
  }

  async saveState() {
    await super.saveState();
  }

  async recoverState() {
    const state = await recoverState("20-20DTL", this.gameId, () =>
      super.recoverState()
    );
    if (state) {
      this.blindCard = state.blindCard;
      this.cards = state.cards;
      this.bets = state.bets;
      this.winner = state.winner;
    }
  }

  async startGame() {
    this.status = GAME_STATES.PRE_BETTING;
    this.timer = Date.now();
    await super.saveState();
  }

  async startDealing() {
    this.status = GAME_STATES.DEALING;
    const { D, T, L } = this.cards;
    this.cards.D = generateSideCard(this.bets.D, getSuitRanking(this.bets.D), getRankRanking(this.bets.D));
    this.cards.T = generateSideCard(this.bets.T, getSuitRanking(this.bets.T), getRankRanking(this.bets.T));
    this.cards.L = generateSideCard(this.bets.L, getSuitRanking(this.bets.L), getRankRanking(this.bets.L));

    await super.saveState();
    this.status = GAME_STATES.COMPLETED;
  }

  async determineWinner() {
    this.status = GAME_STATES.COMPLETED;
    await this.saveState();

    const winner = this.calculateWinner();
    this.winner = winner;
    await this.distributeWinnings(winner);
    await this.endGame();
  }

  calculateWinner() {
    const [leastBetsDragon] = Object.entries(this.bets.D).sort((a, b) => a[1] - b[1]);
    const [leastBetsTiger] = Object.entries(this.bets.T).sort((a, b) => a[1] - b[1]);
    const [leastBetsLion] = Object.entries(this.bets.L).sort((a, b) => a[1] - b[1]);

    if (leastBetsDragon < leastBetsTiger && leastBetsDragon < leastBetsLion) {
      return 'Dragon';
    }
    return leastBetsTiger < leastBetsLion ? 'Tiger' : 'Lion';
  }

  async distributeWinnings(winner) {
    const multiplier = await this.getBetMultiplier(winner);
    const bets = await redis.hgetall(`bets:${this.gameId}`);

    for (const [playerId, betData] of Object.entries(bets)) {
      const bet = JSON.parse(betData);
      const amount = parseFloat(bet.amount);

      if (bet.side === winner) {
        const winnings = amount * multiplier;
        await redis.hincrby(`user:${playerId}:balance`, "amount", winnings);
      } else {
        await redis.hincrby(`user:${playerId}:balance`, "amount", -amount);
      }
      await redis.hdel(`user:${playerId}:active_bets`, this.gameId);
    }
  }
}

DTLGame.prototype.start = startGame;
DTLGame.prototype.startDealing = startDealing;
DTLGame.prototype.determineWinner = determineWinner;
DTLGame.prototype.endGame = endGame;
DTLGame.prototype.storeGameResult = storeGameResult;
DTLGame.prototype.getBetMultiplier = function (side) {
  return getBetMultiplier(this.gameType, this.bets[side]);
};
