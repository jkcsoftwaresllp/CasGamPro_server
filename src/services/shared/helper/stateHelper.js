import redis from "../../../config/redis.js";
import {broadcastGameState} from "../config/handler.js";

export async function saveState() {
    try {
        // console.log("Saving game state...", this.gameId);

        await redis.hmset(`game:${this.gameId}`, {
            status: this.status,
            startTime: this.startTime,
            winner: this.winner || "",
            deck: JSON.stringify(this.deck),
        });

        // Broadcast state change using Socket.IO
        broadcastGameState(this);

        // console.log("State broadcast complete");
    } catch (error) {
        console.error(
            `Failed to save game state for ${this.gameId}:`,
            error,
        );
    }
}

export async function recoverState() {
    try {
        const state = await redis.hgetall(`game:${this.gameId}`);
        if (state && Object.keys(state).length) {
            this.status = state.status;
            this.startTime = state.startTime;
            this.winner = state.winner || null;
            this.deck = JSON.parse(state.deck);
        }
    } catch (error) {
        console.error(
            `Failed to recover game state for ${this.gameId}:`,
            error,
        );
    }
}

export async function clearState() {
    try {
        await redis.del(`game:${this.gameId}`);
    } catch (error) {
        console.error(
            `Failed to clear game state for ${this.gameId}:`,
            error,
        );
    }
}