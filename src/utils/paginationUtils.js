/**
 * Get valid pagination parameters
 * @param {string | number} limit - Requested limit
 * @param {string | number} offset - Requested offset
 * @returns {{ limit: number, offset: number }}
 */
export const getPaginationParams = (limit, offset) => {
  return {
    limit: Math.min(parseInt(limit) || 30, 100), // Max limit of 100
    offset: parseInt(offset) || 0,
  };
};
