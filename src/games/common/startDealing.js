import { logger } from "../../logger/logger.js";
import { GAME_STATES } from "../../services/shared/config/types.js";
import { handlePlayHistorySocket } from "../../socket/handlePlayHistorySocket.js";

export async function startDealing(gameType, gameInstance) {
  try {
    gameInstance.status = GAME_STATES.DEALING;

    // TODO - update UI about bet placed
    // Handle play history updates when a bet is placed
    if (gameInstance.players && gameInstance.players.length > 0) {
      gameInstance.players.forEach((player) => {
        if (player.socketId) {
          // Notify play history socket about bet placement and game state
          handlePlayHistorySocket(io, player.socketId, {
            action: "bet-placed", // Action type (can be customized)
            message: `Bet placed for ${gameType}`,
            gameState: gameInstance.status,
            playerId: player.id,
            gameType,
            stake: player.stake,
            gameInstance, // Pass game instance to handle the actual play history update
          });
        }
      });
    }

    if (gameType === "AndarBahar") {
      gameInstance.deck = await gameInstance.shuffleDeck(gameInstance.deck);
      gameInstance.jokerCard = gameInstance.deck.shift();
      await gameInstance.saveState();
      await gameInstance.dealCards();
    } else if (gameType === "Lucky7B") {
      gameInstance.blindCard = gameInstance.deck.shift();
      gameInstance.secondCard = await gameInstance.calculateResult(); // Sets the second card
      await gameInstance.saveState();

      gameInstance.logGameState("Dealing Phase Started");

      setTimeout(async () => {
        await gameInstance.revealCards();
      }, gameInstance.CARD_DEAL_DURATION);
    } else if (gameType === "TeenPatti") {
      // Deal blind card first
      gameInstance.blindCard = gameInstance.deck.shift();

      // Deal three cards alternately to each player
      for (let i = 0; i < 3; i++) {
        gameInstance.player1Cards.push(gameInstance.deck.shift());
        gameInstance.player2Cards.push(gameInstance.deck.shift());
      }

      await gameInstance.saveState();
      gameInstance.logGameState("Dealing Phase Started");

      setTimeout(async () => {
        await gameInstance.determineWinner();
      }, gameInstance.CARD_DEAL_DURATION);
    }
  } catch (error) {
    logger.error(`Failed to start dealing for ${gameType}:`, error);
  }
}
