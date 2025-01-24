export async function getBetMultiplier(gameType, betSide) {
  if (gameType === "AndarBahar") {
    return 1.96; 
  }

  if (gameType === "Lucky7B") {
    const multipliers = {
      low: 1.96,
      high: 1.96,
      mid: 2.0,
      even: 2.1,
      odd: 1.79,
      black: 1.95,
      red: 1.95,
    };
    return multipliers[betSide] || 1;
  }

  if (gameType === "TeenPatti") {
    return 1.95; // Standard multiplier for Teen Patti
  }

  if (gameType === "DragonTiger") {
    const multipliers = {
      dragon: 1.96,
      tiger: 1.96,
      tie: 8.0,
      pair: 6.0,
      odd: 1.79,
      even: 2.10,
      black: 1.95,
      red: 1.95,
      specificCard: 12.0,
  };
    return multipliers[betSide] || 1;
  }

  throw new Error(`Unsupported game type: ${gameType}`);
}
