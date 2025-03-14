import AndarBaharTwoGame from "../../AndarBaharTwo/index.js";
import Lucky7BGame from "../../Lucky7B/index.js";
import Lucky7AGame from "../../Lucky7A/index.js";
import TeenPattiGame from "../../TeenPatti/index.js";
import DragonTigerGame from "../../DragonTiger20/index.js";
import DragonTigerTwoGame from "../../DragonTiger20Two/index.js";
import AndarBaharGame from "../../AndarBahar/index.js";
import DTLGame from "../../DTL20/index.js";

import { GAME_TYPES } from "./types.js";

class GameFactory {
  static activeGames = new Map();

  static registerGame(gameType, gameClass) {
    GameFactory.activeGames.set(gameType, gameClass);
  }

  static deployGame(gameType, roundId) {
    const GameClass = this.activeGames.get(gameType);
    if (!GameClass) {
      throw new Error(`Gase type ${gameType} not registered`);
    }
    const gameInstance = new GameClass();
    gameInstance.roundId = roundId;
    gameInstance.gameType = gameType;

    return gameInstance;
  }
}

GameFactory.registerGame(GAME_TYPES.ANDAR_BAHAR_TWO, AndarBaharTwoGame);
GameFactory.registerGame(GAME_TYPES.LUCKY7B, Lucky7BGame);
GameFactory.registerGame(GAME_TYPES.LUCKY7A, Lucky7AGame);
GameFactory.registerGame(GAME_TYPES.TEEN_PATTI, TeenPattiGame);
GameFactory.registerGame(GAME_TYPES.DRAGON_TIGER, DragonTigerGame);
GameFactory.registerGame(GAME_TYPES.DRAGON_TIGER_TWO, DragonTigerTwoGame);
GameFactory.registerGame(GAME_TYPES.ANDAR_BAHAR, AndarBaharGame);
GameFactory.registerGame(GAME_TYPES.DRAGON_TIGER_LION, DTLGame);

export default GameFactory;
