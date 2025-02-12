// noinspection SpellCheckingInspection

import AndarBaharTwoGame from "../../AndarBaharTwo/index.js";
import Lucky7BGame from "../../Lucky7B/index.js";
import TeenPattiGame from "../../TeenPatti/index.js";
import DragonTigerGame from "../../DragonTiger20/index.js";
import AndarBaharGame from "../../AndarBahar/index.js";
import DTLGame from "../../DTL20/index.js";

import { GAME_TYPES } from "./types.js";

class GameFactory {
  static gameTypes = new Map();

  static registerGame(type, gameClass) {
    GameFactory.gameTypes.set(type, gameClass);
  }

  static deployGame(gameType, roundId, roomId) {
    const GameClass = GameFactory.gameTypes.get(gameType);
    if (!GameClass) {
      throw new Error(`Gase type ${gameType} not registered`);
    }
    const game = new GameClass(roundId);
    game.roomId = roomId;
    game.gameType = gameType;

    return game;
  }
}

// GameFactory.registerGame(GAME_TYPES.ANDAR_BAHAR_TWO, AndarBaharTwoGame); // under maintainance
// GameFactory.registerGame(GAME_TYPES.LUCKY7B, Lucky7BGame);
GameFactory.registerGame(GAME_TYPES.TEEN_PATTI, TeenPattiGame);
// GameFactory.registerGame(GAME_TYPES.DRAGON_TIGER, DragonTigerGame);
// GameFactory.registerGame(GAME_TYPES.ANDAR_BAHAR, AndarBaharGame);  // broken
// GameFactory.registerGame(GAME_TYPES.DRAGON_TIGER_LION, DTLGame); // broken
export default GameFactory;
