export function initializeBetTotals() {
    return {
        dragon: 0,
        tiger: 0,
        pair: 0,
        tie: 0,
        dragonOdd: 0,
        dragonEven: 0,
        dragonBlack: 0,
        dragonRed: 0,
        dragonA: 0,
        dragon2: 0,
        dragon3: 0,
        dragon4: 0,
        dragon5: 0,
        dragon6: 0,
        dragon7: 0,
        dragon8: 0,
        dragon9: 0,
        dragon10: 0,
        dragonJ: 0,
        dragonQ: 0,
        dragonK: 0,
        tigerOdd: 0,
        tigerEven: 0,
        tigerBlack: 0,
        tigerRed: 0,
        tigerA: 0,
        tiger2: 0,
        tiger3: 0,
        tiger4: 0,
        tiger5: 0,
        tiger6: 0,
        tiger7: 0,
        tiger8: 0,
        tiger9: 0,
        tiger10: 0,
        tigerJ: 0,
        tigerQ: 0,
        tigerK: 0,
    };
}

export function findLeastBetCategory(betTotals) {
    const categories = ["dragon", "tiger", "pair", "tie"];

    const leastBetCategory = categories.reduce((minCategory, category) => {
        return betTotals[category] < betTotals[minCategory] ? category : minCategory;
    });

    return leastBetCategory;
}

export function handleDragonTigerCategory(mainWinner, betTotals) {
    const oddBets = calculateCategoryBets(mainWinner, "odd", betTotals);
    const evenBets = calculateCategoryBets(mainWinner, "even", betTotals);

    const selectedBetType = oddBets < evenBets ? "odd" : "even";

    const specificCardBets = selectedBetType === "odd"
        ? ["3", "5", "7", "9", "J", "K"]
        : ["2", "4", "6", "8", "10", "Q"];

    const leastBetCard = findLeastBetCard(mainWinner, specificCardBets, betTotals);

    const narrowedCards = ["S", "H", "C", "D"].map(suit => `${suit}${leastBetCard.card}`);

    const finalSuit = findFinalSuit(mainWinner, narrowedCards, betTotals);

    const winnerCard = narrowedCards.find(card => finalSuit.includes(card[0]));
    const loserCard = getLowerRankedCard(winnerCard);

    return {
        blindCard: `${getRandomSuit()}${getRandomRank()}`,
        dragonCard: mainWinner === "dragon" ? winnerCard : loserCard,
        blindCard: `${getRandomSuit()}${getRandomRank()}`,
        tigerCard: mainWinner === "tiger" ? winnerCard : loserCard
    };
}

export function calculateCategoryBets(mainWinner, category, betTotals) {
    const betTypes = {
        odd: ["Odd", "A", "3", "5", "7", "9", "J", "K"],
        even: ["Even", "2", "4", "6", "8", "10", "Q"]
    };

    return betTypes[category].reduce((acc, card) => acc + (betTotals[`${mainWinner}${card}`] || 0), 0);
}

export function findLeastBetCard(mainWinner, cards, betTotals) {
    return cards.reduce((min, card) => {
        const bet = betTotals[`${mainWinner}${card}`] || 0;
        return bet < min.amount ? { card, amount: bet } : min;
    }, { card: cards[0], amount: Infinity });
}

export function findFinalSuit(mainWinner, narrowedCards, betTotals) {
    const blackBets = narrowedCards.filter(card => card.includes("S") || card.includes("C"))
        .reduce((acc, card) => acc + (betTotals[`${mainWinner}Black`] || 0), 0);
    const redBets = narrowedCards.filter(card => card.includes("H") || card.includes("D"))
        .reduce((acc, card) => acc + (betTotals[`${mainWinner}Red`] || 0), 0);

    return blackBets < redBets ? ["S", "C"] : ["H", "D"];
}

export function getLowerRankedCard(card) {
    const rankOrder = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const rank = card[1];
    const rankIndex = rankOrder.indexOf(rank);
    const lowerRank = rankIndex > 0 ? rankOrder[rankIndex - 1] : rankOrder[0];
    return `${card[0]}${lowerRank}`;
}

export function getRandomSuit() {
    return ["S", "H", "C", "D"][Math.floor(Math.random() * 4)];
}

export function getRandomRank() {
    return ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][Math.floor(Math.random() * 13)];
}
