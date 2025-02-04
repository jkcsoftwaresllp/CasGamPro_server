import { sortAndConvertRanks } from "./sortAndConvertRanks.js";

export const evaluateHand = (hand) => {
    /*
      Full Evaluation Logic
          - Trail/Set (Three of a Kind): All cards of the same rank.
          - Pure Sequence (Straight Flush): Three consecutive cards of the same suit.
          - Sequence (Straight): Three consecutive cards of any suit.
          - Color (Flush): Three cards of the same suit, not in sequence.
          - Pair: Two cards of the same rank.
          - High Card: The highest card when no other hand applies.

      Detailed Steps for the Evaluation:
          - Check for Trail/Set: If all three cards have the same rank, it's a Trail/Set.
          - Check for Pure Sequence: If the three cards are in a sequence and have the same suit, it's a Pure Sequence.
          - Check for Sequence: If the three cards are in a sequence, it's a Sequence.
          - Check for Color: If the three cards have the same suit but are not in sequence, it's a Color.
          - Check for Pair: If there are exactly two cards with the same rank, it's a Pair.
          - Check for High Card: If no other hands are found, determine the hand by the highest card.
   */

    // Extract ranks and suits from the hand
    const ranks = hand.map((card) => card.slice(1)); // Extract rank from the card code (e.g., H2 -> 2, S10 -> 10)
    const suits = hand.map((card) => card[0]); // Extract suit from the card code (e.g., H, S, C, D)

    // Sort ranks in descending order for easier comparison later
    const sortedRanks = ranks
        .map((rank) => {
            if (rank === "A") return 14;
            if (rank === "K") return 13;
            if (rank === "Q") return 12;
            if (rank === "J") return 11;
            return parseInt(rank);
        })
        .sort((a, b) => b - a);

    // Count the occurrences of each rank in the hand to determine the type of pair (if any)
    const rankCount = {}; // Object to store the frequency of each rank

    sortedRanks.forEach((rank) => {
        rankCount[rank] = (rankCount[rank] || 0) + 1; // Increment the count for the current rank
    });

    // Check for Trail (eg: Three of a Kind)
    if (Object.values(rankCount).includes(3)) {
        return 6; // Trail (Set)
    }

    // Check for Pure Sequence (Straight Flush)
    const isSameSuit = suits.every((suit) => suit === suits[0]);
    const isSequence =
        Math.abs(sortedRanks[0] - sortedRanks[1]) === 1 &&
        Math.abs(sortedRanks[1] - sortedRanks[2]) === 1;

    if (isSequence && isSameSuit) {
        return 5; // Pure Sequence (Straight Flush)
    }

    // Check for Sequence (Straight)
    if (isSequence) {
        return 4; // Sequence (Straight)
    }

    // Check for Color (Flush)
    if (isSameSuit) {
        return 3; // Color (Flush)
    }

    // Check for Pair
    if (Object.values(rankCount).includes(2)) {
        return 2; // "Pair"
    }

    // High Card (if no other hand)
    return 1; // High Card
};