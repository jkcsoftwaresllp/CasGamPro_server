export function createGameStateProxy(game) {
  const handler = {
    set(target, property, value) {
      const oldValue = target[property];
      target[property] = value;

      // Trigger broadcast if watched properties change
      if (["status", "players"].includes(property) && oldValue !== value) {
        game.broadcastGameState();
      }

      return true;
    },
  };

  // Create deep proxy for players object
  const createArrayProxy = (array, parentKey) => {
    return new Proxy(array, {
      set(target, property, value) {
        target[property] = value;
        game.broadcastGameState();
        return true;
      },
    });
  };

  // Create proxy for players object
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

  // Main game object proxy
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

  // Create proxy for arrays
  const createArrayProxy = (array, parentKey) => {
    return new Proxy(array, {
      set(target, property, value) {
        target[property] = value;
        observer.notify('players', null, game.players);
        return true;
      }
    });
  };

  // Watch status changes
  let _status = game.status;
  Object.defineProperty(game, "status", {
    get: () => _status,
    set: (newValue) => {
      const oldValue = _status;
      _status = newValue;
      observer.notify("status", oldValue, newValue);
    },
  });

  // Watch players changes with deep proxy
  let _players = game.players;
  Object.defineProperty(game, "players", {
    get: () => _players,
    set: (newValue) => {
      // Create proxies for arrays
      if (newValue.A) {
        newValue.A = createArrayProxy(newValue.A, 'A');
      }
      if (newValue.B) {
        newValue.B = createArrayProxy(newValue.B, 'B');
      }
      if (newValue.C) {
        newValue.C = createArrayProxy(newValue.C, 'C');
      }

      const oldValue = _players;
      _players = newValue;
      observer.notify("players", oldValue, newValue);
    },
  });

  // Create initial proxies for arrays
  game.players.A = createArrayProxy(game.players.A, 'A');
  game.players.B = createArrayProxy(game.players.B, 'B');
  game.players.C = createArrayProxy(game.players.C, 'C');

  // Subscribe to changes
  observer.subscribe("status", () => game.broadcastGameState());
  observer.subscribe("players", () => game.broadcastGameState());

  return game;
}
