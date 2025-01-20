export async function distributeWinnings(resultCategory) {
    for (let [playerId, betDetails] of this.players) {
      if (betDetails.category === resultCategory) {
        this.players.get(playerId).balance +=
          betDetails.amount * this.getBetProfitPercentage(resultCategory);
      } else {
        this.players.get(playerId).balance -= betDetails.amount;
      }
    }
  
    this.logGameState(`Winnings Distributed`);
  }
  