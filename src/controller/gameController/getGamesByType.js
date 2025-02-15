import { GAME_CONFIGS } from '../../services/shared/config/types.js';

export const getGamesByType = async (req, res) => {
  try {

    await checkBlockingLevel(req, res, () => {});
    
    const { gameType } = req.params;

    //   list of Games under the specific catagory that blocked/non-blocked

    /**
     * 
     * 1. List of Game Catagory (blocking/unblocking)
     * 2. List of Games under the specific catagory (blocking/unblocking)
     * 3. Toggling of blocking/unblocking 
     *      - Game Catagory
     *      - Games under specific Catagory
     */

    if (!gameType) {
      return res.status(400).json({
        uniqueCode: 'CGP0077',
        message: 'gameType path parameter is required',
        data: { error: 'gameType path parameter is required' }
      });
    }

    const games = GAME_CONFIGS.filter(game => game.name.toLowerCase() === gameType.toLowerCase())
      .map((game, index) => ({
        betFairId: `GT${String(index + 1).padStart(3, '0')}`,
        name: game.name,
        status: 'active' // Default status for now
      }));

    if (games.length === 0) {
      return res.status(404).json({
        uniqueCode: 'CGP0078',
        message: 'No games found for the specified gameType',
        data: { error: 'No games found for the specified gameType' }
      });
    }

    res.status(200).json({
      uniqueCode: 'CGP0079',
      message: 'Games fetched successfully',
      data: games
    });
  } catch (error) {
    res.status(500).json({
      uniqueCode: 'CGP0080',
      message: 'Error fetching games',
      data: { error: error.message }
    });
  }
};