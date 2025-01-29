// noinspection SpellCheckingInspection

import AndarBaharGame from "../../AndarBahar/index.js";
import Lucky7BGame from "../../Lucky7B/index.js";
import TeenPattiGame from "../../TeenPatti/index.js";
import DragonTigerGame from "../../DragonTiger20/index.js";

import {GAME_TYPES} from "./types.js";

class GameFactory {
  static gameTypes = new Map();

  static registerGame(type, gameClass) {
    GameFactory.gameTypes.set(type, gameClass);
  }

  static createGame(type, gameId) {
    const GameClass = GameFactory.gameTypes.get(type);
    if (!GameClass) {
      throw new Error(`Game type ${type} not registered`);
    }
    return new GameClass(gameId);
  }
}

GameFactory.registerGame(GAME_TYPES.ANDAR_BAHAR, AndarBaharGame);
GameFactory.registerGame(GAME_TYPES.LUCKY7B, Lucky7BGame);
GameFactory.registerGame(GAME_TYPES.TEEN_PATTI, TeenPattiGame);
GameFactory.registerGame(GAME_TYPES.DRAGON_TIGER, DragonTigerGame);

export default GameFactory;
