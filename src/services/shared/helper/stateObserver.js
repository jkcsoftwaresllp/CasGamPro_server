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

  game.players = new Proxy(game.players, {
    set(target, property, value) {
      if (Array.isArray(value)) {
        target[property] = createArrayProxy(value, property);
      } else {
        target[property] = value;
      }
      game.broadcastGameState();
      return true;
    },
  });

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

  const createArrayProxy = (array, parentKey) => {
    return new Proxy(array, {
      set(target, property, value) {
        target[property] = value;
        observer.notify("players", null, game.players);
        return true;
      },
    });
  };

  let _status = game.status;
  Object.defineProperty(game, "status", {
    get: () => _status,
    set: (newValue) => {
      const oldValue = _status;
      _status = newValue;
      observer.notify("status", oldValue, newValue);
    },
  });

  let _players = game.players;
  Object.defineProperty(game, "players", {
    get: () => _players,
    set: (newValue) => {
      if (newValue.A) {
        newValue.A = createArrayProxy(newValue.A, "A");
      }
      if (newValue.B) {
        newValue.B = createArrayProxy(newValue.B, "B");
      }
      if (newValue.C) {
        newValue.C = createArrayProxy(newValue.C, "C");
      }

      const oldValue = _players;
      _players = newValue;
      observer.notify("players", oldValue, newValue);
    },
  });

  let _jokerCard = game.jokerCard;
  Object.defineProperty(game, "jokerCard", {
    get: () => _jokerCard,
    set: (newValue) => {
      const oldValue = _jokerCard;
      _jokerCard = newValue;
      observer.notify("jokerCard", oldValue, newValue);
    },
  });

  // BlindCard observer
  let _blindCard = game.blindCard;
  Object.defineProperty(game, "blindCard", {
    get: () => _blindCard,
    set: (newValue) => {
      const oldValue = _blindCard;
      _blindCard = newValue;
      observer.notify("blindCard", oldValue, newValue);
    },
  });

  game.players.A = createArrayProxy(game.players.A, "A");
  game.players.B = createArrayProxy(game.players.B, "B");
  game.players.C = createArrayProxy(game.players.C, "C");

  observer.subscribe("status", () => game.broadcastGameState());
  observer.subscribe("players", () => game.broadcastGameState());
  observer.subscribe("jokerCard", () => game.broadcastGameState());
  observer.subscribe("blindCard", () => game.broadcastGameState());

  return game;
}
