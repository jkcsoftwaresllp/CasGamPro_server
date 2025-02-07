import { GAME_CONFIGS } from '../../services/shared/config/types.js';

export const getGameTypes = async (req, res) => {
  try {
    const gameTypes = GAME_CONFIGS.map(game => ({
      betFairId: 'G001', // Default for now
      name: 'casino', //Default for now
      status: 'active' // Default for now
    }));

    res.status(200).json({
      uniqueCode: 'CGP0051',
      message: 'Game types fetched successfully',
      data: gameTypes
    });
  } catch (error) {
    res.status(500).json({
      uniqueCode: 'CGP0052',
      message: 'Error fetching game types',
      data: { error: error.message }
    });
  }
};