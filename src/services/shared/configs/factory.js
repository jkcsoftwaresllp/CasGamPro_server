// noinspection SpellCheckingInspection

import AndarBaharGame from "../../AndarBahar/index.js";
import {GAME_TYPES} from "./types.js";

class GameFactory {
  static createGame(type, gameId) {
    switch (type) {
      case GAME_TYPES.ANDAR_BAHAR:
        return new AndarBaharGame(gameId);
      default:
        throw new Error(`Unknown game type: ${type}`);
    }
  }
}

export default GameFactory;
