import { eq } from "drizzle-orm";
import { db } from "../../../config/db.js";
import { users } from "../../schema.js";

/**
 * Updates one or more balance-related columns (`wallet`, `coins`, `exposure`) for a given user.
 *
 * @param {string} userId - The ID of the user whose balance needs to be updated.
 * @param {Object} updateValues - An object containing the columns to update and their new values.
 * @param {number} [updateValues.balance] - The new wallet balance (optional).
 * @param {number} [updateValues.coins] - The new coins balance (optional).
 * @param {number} [updateValues.exposure] - The new exposure balance (optional).
 *
 * @throws {Error} Throws an error if `userId` is missing or no update values are provided.
 *
 * @returns {Promise<void>} Resolves when the update is completed.
 *
 * @example
 * // Updating only wallet balance
 * await updateDBUserColumns("user-123", { balance: 500.00 });
 *
 * @example
 * // Updating wallet and coins
 * await updateDBUserColumns("user-123", { balance: 500.00, coins: 100.00 });
 *
 * @example
 * // Updating all three balances
 * await updateDBUserColumns("user-123", { balance: 500.00, coins: 100.00, exposure: 50.00 });
 */
export const updateDBUserColumns = async (userId, updateValues) => {
  if (!userId || Object.keys(updateValues).length === 0) {
    throw new Error(
      "Invalid input: userId and at least one update value are required."
    );
  }

  await db.update(users).set(updateValues).where(eq(users.id, userId));
};
