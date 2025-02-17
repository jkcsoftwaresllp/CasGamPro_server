export function createGameStateProxy(game) {
  const createArrayProxy = (array, parentKey) => {
    return new Proxy(array, {
      set(target, property, value) {
        target[property] = value;
        game.broadcastGameState();
        return true;
      },
    });
  };

  return new Proxy(game, {
    set(target, property, value) {
      const oldValue = target[property];

      if (property === "status" || property === "winner") {
        target[property] = value;
        if (oldValue !== value) {
          game.broadcastGameState();
        }
      } else {
        target[property] = value;
      }

      return true;
    },
  });
}

class GameStateObserver {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(property, callback) {
    if (!this.listeners.has(property)) {
      this.listeners.set(property, new Set());
    }
    this.listeners.get(property).add(callback);
  }

  notify(property, oldValue, newValue) {
    if (this.listeners.has(property)) {
      this.listeners
        .get(property)
        .forEach((callback) => callback(property, oldValue, newValue));
    }
  }
}

export function createGameStateObserver(game) {
  const observer = new GameStateObserver();

  let _status = game.status;
  Object.defineProperty(game, "status", {
    get: () => _status,
    set: (newValue) => {
      const oldValue = _status;
      _status = newValue;
      observer.notify("status", oldValue, newValue);
    },
  });

  observer.subscribe("status", () => game.broadcastGameState());

  return game;
}
