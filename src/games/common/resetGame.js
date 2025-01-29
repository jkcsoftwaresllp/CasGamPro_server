export default function resetGame() {
  this.jokerCard = null;
  this.playerA = [];
  this.playerB = [];
  this.winner = null;
  this.status = null;
  this.deck = this.initializeDeck();

}
