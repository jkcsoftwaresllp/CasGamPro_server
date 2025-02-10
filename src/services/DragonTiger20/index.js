import { startGame } from "../../games/common/start.js";
import { startDealing } from "../../games/common/startDealing.js";
import { endGame } from "../../games/common/endGame.js";
import { getBetMultiplier } from "../../games/common/getBetMultiplier.js";
import BaseGame from "../shared/config/base_game.js";
import { GAME_TYPES } from "../shared/config/types.js";
import { determineOutcome, determineWinner, distributeWinnings, } from "./methods.js";
import { folderLogger } from "../../logger/folderLogger.js";

export default class DragonTigerGame extends BaseGame {
  constructor(gameId) {
    super(gameId);
    this.gameType = GAME_TYPES.DRAGON_TIGER; //workaround for now
    this.dragonCard = null;
    this.tigerCard = null;
    this.real_winner = null; //talk about workarounds
    this.blindCard = null;
    this.bettingResults = {
      dragon: [],
      tiger: [],
      tie: [],
      pair: [],
      odd: [],
      even: [],
      black: [],
      red: [],
      specificCard: [],
    };
    this.players = {
      A: [],
      B: [],
    }
    this.winner = null;
    this.BETTING_PHASE_DURATION = 2000;
    this.CARD_DEAL_DURATION = 3000;
    this.betSides = [
      "dragon",
      "tiger",
      "tie",
      "pair",
      "odd",
      "even",
      "black",
      "red",
      "specificCard",
    ];
    this.gameInterval = null;
  }

  logGameState(event) {
    return;
    folderLogger("game_logs/DragonTiger20", "DragonTiger20").info(
      JSON.stringify(
        {
          gameType: this.gameType,
          status: this.status,
          winner: this.winner,
          dragonCard: this.dragonCard,
          tigerCard: this.tigerCard,
        },
        null,
        2
      )
    ); // Using a 2-space indentation for better formatting
    return;
    console.log(`\n=== ${this.gameId} - ${event} ===`);
    console.log("Type: DragonTiger");
    console.log("Status:", this.status);
    console.log("Winner:", this.winner);
    //console.log("Dragon Card:", this.dragonCard);
    console.log(
      "Dragon Card:",
      this.status === "dealing" ? null : this.dragonCard
    );
    //console.log("Tiger Card:", this.tigerCard);
    console.log(
      "Tiger Card:",
      this.status === "dealing" ? null : this.tigerCard
    );
    console.log("Time:", new Date().toLocaleTimeString());
    console.log("===============================\n");
  }
}

DragonTigerGame.prototype.start = startGame;
DragonTigerGame.prototype.startDealing = startDealing;
DragonTigerGame.prototype.endGame = endGame;
DragonTigerGame.prototype.distributeWinnings = distributeWinnings;
// DragonTigerGame.prototype.calculateResult = calculateResult;
DragonTigerGame.prototype.getBetMultiplier = getBetMultiplier;
DragonTigerGame.prototype.determineOutcome = determineOutcome;
DragonTigerGame.prototype.determineWinner = determineWinner;
