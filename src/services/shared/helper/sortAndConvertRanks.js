// Helper function to convert card ranks and sort them in descending order
export const sortAndConvertRanks = (hand) => {
    return hand
        .map((card) => card.slice(1)) // Extract the rank (e.g., "H2" -> "2", "C10" -> "10")
        .map((rank) => {
            // Convert rank to a number (e.g., "2" -> 2, "A" -> 14, "K" -> 13, etc.)
            if (rank === "A") return 14;
            if (rank === "K") return 13;
            if (rank === "Q") return 12;
            if (rank === "J") return 11;
            return parseInt(rank);
        })
        .sort((a, b) => b - a); // Sort descending order
};