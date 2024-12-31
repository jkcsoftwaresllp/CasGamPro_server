import pool from "../../config/db.js"; // Import your DB connection

export const getMinimumStakePlayer = async () => {
    try {
        // Step 1: Fetch all stake details for both players from the database
        const [result] = await pool.query("SELECT player, amount FROM StakeDetails");

        // Handle empty table or equal stakes by returning randomly
        if (
            result.length === 0 ||
            result.every((row) => row.amount === 0)
        ) {
            // Randomly return either Player-1 or Player-2 if no stake data or if both have 0 stake
            return Math.random() < 0.5 ? "Player-1" : "Player-2";
        }

        // Initialize player amounts
        const playerAmounts = {};

        // Step 2: Aggregate amounts for each player
        result.forEach((row) => {
            const amount = parseFloat(row.amount);
            if (isNaN(amount)) {
                console.warn(`Invalid amount for ${row.player}: ${row.amount}`);
            } else {
                playerAmounts[row.player] = (playerAmounts[row.player] || 0) + amount;
            }
        });

        // If both players have the same stake, return randomly
        if (playerAmounts["Player-1"] === playerAmounts["Player-2"]) {
            return Math.random() < 0.5 ? "Player-1" : "Player-2";
        }

        // Identify player with the minimum stake
        const minPlayer =
            playerAmounts["Player-1"] < playerAmounts["Player-2"]
                ? "Player-1"
                : "Player-2";

        return minPlayer;
    } catch (error) {
        console.error("Error fetching stake details:", error);
        throw new Error("Error fetching stake details");
    }
};