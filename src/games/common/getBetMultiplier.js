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

  throw new Error(`Unsupported game type: ${gameType}`);
}
