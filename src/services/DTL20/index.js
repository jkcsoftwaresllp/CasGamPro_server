import { startGame } from '../../games/common/start.js';
import { startDealing } from '../../games/common/startDealing.js';
import { endGame } from '../../games/common/endGame.js';
import { getBetMultiplier } from '../../games/common/getBetMultiplier.js';
import BaseGame from '../shared/config/base_game.js';
import { GAME_TYPES } from '../shared/config/types.js';
import { generateLosingHand, generateWinnerHand, distributeWinnings, determineWinner, } from './methods.js';

export default class DTLGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.gameType = GAME_TYPES.DRAGON_TIGER_LION;
    this.blindCard = null;
    this.players = {
      A: [], // Dragon cards
      B: [], // Tiger cards 
      C: [], // Lion cards
    }
    this.bettingResults = {
      dragon: [],
      tiger: [],
      lion: [],
    };
    this.winner = null;
    this.BETTING_PHASE_DURATION = 2000;
    this.CARD_DEAL_DURATION = 5000;
    this.betSides = ['dragon', 'tiger', 'lion'];
    this.gameInterval = null;
  }

  async determineOutcome(bets) {
    const betResults = {
      dragon: bets.dragon || 0,
      tiger: bets.tiger || 0,
      lion: bets.lion || 0,
    };

    this.winner = Object.keys(betResults).reduce((a, b) =>
      betResults[a] < betResults[b] ? a : b
    );

    const winningHand = generateWinnerHand(this.deck, this.winner);
    const losingHands = this.betSides
      .filter((side) => side !== this.winner)
      .map((side) => generateLosingHand(this.deck, winningHand));

    if (this.winner === 'dragon') {
      this.players.A = winningHand;
      this.players.B = losingHands[0];
      this.players.C = losingHands[1];
    } else if (this.winner === 'tiger') {
      this.players.A = losingHands[0];
      this.players.B = winningHand;
      this.players.C = losingHands[1];
    } else {
      this.players.A = losingHands[0];
      this.players.B = losingHands[1];
      this.players.C = winningHand;
    }

    await this.distributeWinnings();
    await this.endGame();
  }
}

DTLGame.prototype.start = startGame;
DTLGame.prototype.startDealing = startDealing;
DTLGame.prototype.determineWinner = determineWinner;
DTLGame.prototype.distributeWinnings = distributeWinnings;
DTLGame.prototype.endGame = endGame;
DTLGame.prototype.getBetMultiplier = function (side) { return getBetMultiplier(this.gameType, this.bettingResults[side]); };
