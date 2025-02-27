import { GAME_STATES } from "./types.js";

export default class StateMachine {
  constructor() {
    this.currentState = null;
    this.previousState = null;
    this.transitions = {
      [GAME_STATES.WAITING]: [GAME_STATES.BETTING],
      [GAME_STATES.BETTING]: [GAME_STATES.DEALING],
      [GAME_STATES.DEALING]: [GAME_STATES.COMPLETED],
      [GAME_STATES.COMPLETED]: [GAME_STATES.WAITING],
      null: [GAME_STATES.WAITING]
    };

    this.stateTimeouts = new Map();
  }

  isValidTransition(fromState, toState) {
    if (fromState === null && toState === GAME_STATES.WAITING) {
      return true;
    }

    if (fromState === toState) {
      return false;
    }

    return this.transitions[fromState]?.includes(toState);
  }

  clearStateTimeout() {
    for (const [_, timeout] of this.stateTimeouts) {
      clearTimeout(timeout);
    }
    this.stateTimeouts.clear();
  }
}
