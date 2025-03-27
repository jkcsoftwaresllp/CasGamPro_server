import { eq } from "drizzle-orm";
import { logger } from "../../../logger/logger.js";
import { ledger, users } from "../../schema.js";
import { db } from "../../../config/db.js";

/**
 * Creates a ledger entry and updates the user's balance (wallet, coins, or exposure).
 *
 * @param {Object} params - The function parameters.
 * @param {string} params.userId - The ID of the user whose balance will be updated.
 * @param {number} params.amount - The transaction amount (positive for credit, negative for debit).
 * @param {string} params.type - The type of transaction (e.g., 'deposit', 'withdraw', 'bet').
 * @param {string|null} [params.roundId=null] - The round ID associated with the transaction (if applicable).
 * @param {string} params.entry - A description or reference for the transaction entry.
 * @param {string|string[]} params.balanceType - The balance type(s) to update. Can be:
 *   - A single string (`'coins'`, `'wallet'`, or `'exposure'`).
 *   - An array of multiple types (e.g., `['coins', 'wallet']` to update both).
 * @param {Object|null} [params.tx=null] - An optional transaction object. If provided, the function will use this transaction.
 * @param {number|Object|null} [params.previousBalanceAddOn=null] - Additional amount(s) to add to the user's previous balance before updating:
 *   - If a **single balanceType** is passed, this should be a number (e.g., `50`).
 *   - If **multiple balanceTypes** are passed, this should be an object with keys matching the balance types, e.g., `{ coins: 50, wallet: 20 }`.
 *   - If `null`, no additional amount is added.
 * @returns {Promise<void>} - Resolves when the ledger entry is successfully created.
 * @throws {Error} - Throws an error if the balanceType is invalid or if a database operation fails.
 */
export async function createLedgerEntry({
  userId,
  amount,
  type,
  roundId = null,
  entry,
  balanceType, // Single type (string) or multiple types (array)
  tx: tx1 = null,
  previousBalanceAddOn = null, // Number for single type, object for multiple types
}) {
  try {
    const columnDictForLedger = {
      coins: "new_coins_balance",
      wallet: "new_wallet_balance",
      exposure: "new_exposure_balance",
    };

    const columnDictForUser = {
      coins: users.coins,
      wallet: users.balance,
      exposure: users.exposure,
    };

    // Ensure balanceType is an array for consistency
    const balanceTypes = Array.isArray(balanceType)
      ? balanceType
      : [balanceType];

    // Validate balance types
    for (const type of balanceTypes) {
      if (!columnDictForLedger[type] || !columnDictForUser[type]) {
        throw new Error(
          `Invalid balanceType: ${type}. Must be one of {coins, wallet, exposure}`
        );
      }
    }

    const credit = parseFloat(amount) >= 0 ? amount : 0;
    const debit = parseFloat(amount) < 0 ? Math.abs(amount) : 0;

    // Start transaction if not provided
    const result = await db.transaction(async (tx2) => {
      const tx = tx1 ? tx1 : tx2;

      const ledgerEntry = {
        user_id: userId,
        round_id: roundId,
        transaction_type: type,
        entry: entry,
        credit: credit,
        debit: debit,
        status: "COMPLETED",
        stake_amount: amount,
        description: `${type} transaction`,
      };

      let newBalances = {};

      if (userId) {
        // Fetch all required balances in a single query
        const selectedColumns = balanceTypes.reduce((acc, type) => {
          acc[type] = columnDictForUser[type];
          return acc;
        }, {});

        const [userBalance] = await tx
          .select(selectedColumns)
          .from(users)
          .where(eq(users.id, userId));

        for (const type of balanceTypes) {
          const currentBalance = userBalance?.[type] ?? 0;
          const addOn = previousBalanceAddOn
            ? typeof previousBalanceAddOn === "object"
              ? previousBalanceAddOn[type] || 0
              : previousBalanceAddOn
            : 0;

          newBalances[type] = parseFloat(currentBalance) + parseFloat(addOn);
          ledgerEntry[columnDictForLedger[type]] = newBalances[type].toFixed(2);
        }

        // if (["COMMISSION", "GIVE"].includes(type))
      }

      // if (["COMMISSION", "GIVE"].includes(type))

      await tx.insert(ledger).values(ledgerEntry);
    });

    return result; // Ensure transaction result is returned
  } catch (err) {
    logger.error("Error while creating ledger entry:", err);
    throw err; // Rethrow error for proper handling
  }
}
