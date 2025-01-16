// Get bet multiplier for Andar Bahar
export async function getBetMultiplierAndarBahar(betSide) {
  return 1.96; // Fixed multiplier for Andar Bahar
}

// Get bet multiplier for Lucky 7B
export function getBetMultiplierLucky7B(betSide) {
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