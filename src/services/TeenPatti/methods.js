import {GAME_STATES} from "../shared/config/types.js";
import {
    generateColor,
    generateHighCard,
    generatePair,
    generatePureSequence,
    generateSequence,
    generateTrail
} from "./helper.js";
import redis from "../../config/redis.js";

export function generateWinningHand(deck) {
    // Generate a strong hand (e.g., trail, pure sequence, or sequence)
    const handTypes = [generateTrail, generatePureSequence, generateSequence, generateColor];
    const randomHandType = handTypes[Math.floor(Math.random() * handTypes.length)];
    return randomHandType(deck);
}

export function generateLosingHand(deck, winningHand) {
    // Generate a hand that's guaranteed to be lower than the winning hand
    const usedCards = new Set(winningHand);
    const availableCards = deck.filter(card => !usedCards.has(card));

    // Generate a pair or high card hand
    const handTypes = [generatePair, generateHighCard];
    const randomHandType = handTypes[Math.floor(Math.random() * handTypes.length)];
    return randomHandType(availableCards);
}

export async function determineWinner() {
    try {
        this.status = GAME_STATES.COMPLETED;
        this.winner = await this.calculateResult();
        await this.saveState();

        this.logGameState("Winner Determined");

        await this.distributeWinnings();
        await this.endGame();
    } catch (error) {
        console.error("Error in determineWinner:", error);
        throw error;
    }
}

export async function distributeWinnings() {
    try {
        const multiplier = await this.getBetMultiplier();
        const bets = await redis.hgetall(`bets:${this.gameId}`);

        for (const [playerId, betData] of Object.entries(bets)) {
            const bet = JSON.parse(betData);
            const amount = parseFloat(bet.amount);

            if (bet.side === this.winner) {
                // Winner gets their bet back plus winnings
                const winnings = amount * multiplier;
                await redis.hincrby(`user:${playerId}:balance`, 'amount', winnings);
            } else {
                // Loser loses their bet
                await redis.hincrby(`user:${playerId}:balance`, 'amount', -amount);
            }

            // Clear the active bet
            await redis.hdel(`user:${playerId}:active_bets`, this.gameId);
        }

        this.logGameState("Winnings Distributed");
    } catch (error) {
        console.error("Error in distributeWinnings:", error);
        throw error;
    }
}
