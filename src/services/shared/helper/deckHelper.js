export function initializeDeck() {
    const suits = ["H", "D", "C", "S"];
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A",];

    let deck = [];
    suits.forEach((suit) => {
        ranks.forEach((rank) => {
            deck.push(`${suit}${rank}`);
        });
    });

    // Shuffle the deck
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}
