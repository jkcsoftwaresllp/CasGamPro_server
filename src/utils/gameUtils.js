import { getUserById } from "../database/queries/users/sqlGetUsers.js";

/**
 * Checks whether a game is blocked for a user based on hierarchy.
 * @param {number} userId - The player's ID.
 * @param {number} blockedBy - The user ID who blocked the game.
 * @returns {Promise<boolean>} - True if the game is blocked for the user.
 */
export const isGameBlockedForUser = async (userId, blockedBy) => {
  if (!blockedBy) return false;

  let currentParent = userId;

  // Traverse up the hierarchy to check if any parent blocked the game
  while (currentParent) {
    const user = await getUserById(currentParent);
    if (!user) break;

    if (user.id === blockedBy) {
      return true; // Game is blocked for this user
    }

    currentParent = user.parent_id; // Move up the hierarchy
  }

  return false; // Not blocked for the user
};
