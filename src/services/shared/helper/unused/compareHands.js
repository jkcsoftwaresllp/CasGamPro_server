import { evaluateHand } from "./evaluateHand.js";
import { sortAndConvertRanks } from "./sortAndConvertRanks.js";

export const compareHands = (hand1, hand2) => {
    // Evaluate both hands
    const hand1Rank = evaluateHand(hand1);
    const hand2Rank = evaluateHand(hand2);

    // Step 1: Compare the hand ranks
    if (hand1Rank > hand2Rank) {
        return 1; // Hand 1 is higher
    } else if (hand1Rank < hand2Rank) {
        return 2; // Hand 2 is higher
    }

    // Step 2: If ranks are equal, compare the highest card in both hands
    const sortedHand1 = sortAndConvertRanks(hand1); // Use helper function for sorting
    const sortedHand2 = sortAndConvertRanks(hand2); // Use helper function for sorting

    // Compare the highest card
    if (sortedHand1[0] > sortedHand2[0]) {
        return 1; // Hand 1 is higher
    } else if (sortedHand1[0] < sortedHand2[0]) {
        return 2; // Hand 2 is higher
    }

    // Step 3: If all else is equal, the hands are the same (return 0)
    return 0; // Hands are equal
};