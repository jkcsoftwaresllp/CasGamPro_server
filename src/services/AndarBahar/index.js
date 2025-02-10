import { startDealing } from "../../games/common/startDealing.js";
import { getBetMultiplier } from "../../games/common/getBetMultiplier.js";
import BaseGame from "../shared/config/base_game.js";
import { GAME_STATES, GAME_TYPES } from "../shared/config/types.js";
import { determineOutcome, distributeWinnings, determineWinner, } from "./method.js";
import resetGame from "../../games/common/resetGame.js";
import { folderLogger } from "../../logger/folderLogger.js";

export default class AndarBaharGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.gameType = GAME_TYPES.ANDAR_BAHAR; //workaround for now
    this.jokerCard = null;
    this.players = {
      A: [],
      B: [],
    }
    this.betSides = ["Andar", "Bahar"];
    this.winner = null;
    this.status = GAME_STATES.WAITING;
    this.BETTING_PHASE_DURATION = 2000; // Example value
    this.CARD_DEAL_INTERVAL = 3000; // Example value
  }

  logGameState(event) {
    return;
    folderLogger("game_logs/AndarBahar", "AndarBahar").info(
      JSON.stringify(
        {
          gameType: this.gameType,
          status: this.status,
          winner: this.winner,
          jokerCard: this.jokerCard,
          andarCards: this.andarCards,
          baharCards: this.baharCards,
        },
        null,
        2
      )
    ); // Using a 2-space indentation for better formatting
    return;
  }
}

AndarBaharGame.prototype.startDealing = startDealing;
AndarBaharGame.prototype.determineWinner = determineWinner;
AndarBaharGame.prototype.distributeWinnings = distributeWinnings;
AndarBaharGame.prototype.getBetMultiplier = getBetMultiplier;
AndarBaharGame.prototype.resetGame = resetGame;
AndarBaharGame.prototype.determineOutcome = determineOutcome;
