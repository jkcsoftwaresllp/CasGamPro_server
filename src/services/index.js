import GameFactory from "./shared/configs/factory.js";
import gameManager from "./shared/configs/manager.js";

export function initializeGameServices() {
    try {
        gameManager.gameTypes.forEach((gameConfig) => {
            const gameId = `${gameConfig.id}_${Date.now()}`;
            const game = GameFactory.createGame(gameConfig.type, gameId);
            gameManager.activeGames.set(gameId, game);
            game.start();
        });

        console.log("\n=== Game Manager Initialized ===");
        console.log(`Total Games Running: ${gameManager.activeGames.size}`);
    } catch (error) {
        console.error("Failed to initialize game services:", error);
    }
}