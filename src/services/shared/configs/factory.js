// noinspection SpellCheckingInspection

import AndarBaharGame from "../../AndarBahar/index.js";
import Lucky7BGame from "../../Lucky7B/index.js";

import {GAME_TYPES} from "./types.js";

class GameFactory {
  static createGame(type, gameId) {
    switch (type) {
      case GAME_TYPES.ANDAR_BAHAR:
        return new AndarBaharGame(gameId);

      case GAME_TYPES.LUCKY7B:
         return new Lucky7BGame(gameId);  

      default:
        throw new Error(`Unknown game type: ${type}`);
    }
  }
}

export default GameFactory;
