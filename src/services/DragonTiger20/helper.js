export function initializeBetTotals() {
    return {
			dragon: 0,
			tiger: 0,
			tie: 0,
			pair: 0,
			D2: 0,
			D3: 0,
			DA: 0,
			D4: 0,
			D5: 0,
			D6: 0,
			D7: 0,
			D8: 0,
			D9: 0,
			D10: 0,
			DJ: 0,
			DQ: 0,
			DK: 0,
			TA: 0,
			T2: 0,
			T3: 0,
			T4: 0,
			T5: 0,
			T6: 0,
			T7: 0,
			T8: 0,
			T9: 0,
			T10: 0,
			TJ: 0,
			TQ: 0,
			TK: 0,
			tred: 0,
			teven: 0,
			todd: 0,
			tblack: 0,
			dred: 0,
			deven: 0,
			dodd: 0,
			dblack: 0,
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
