import { eq } from "drizzle-orm";
import { logger } from "../../../logger/logger.js";
import { ledger, users } from "../../schema.js";

/**
 * balanceType : coins, wallet, exposure
 *
 *
 */
export async function createLedgerEntry({
  userId,
  amount,
  type,
  roundId = null,
  entry,
  balanceType, // coins, wallet, exposure
  tx = null, // Optional transaction
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

    const columnTypeForLedger = columnDictForLedger[balanceType];
    const columnTypeForUser = columnDictForUser[balanceType];

    if (!columnTypeForLedger || !columnTypeForUser) {
      throw new Error(
        "Invalid balanceType! Must be one of {coins, wallet, exposure}"
      );
    }

    const credit = parseFloat(amount) >= 0 ? amount : 0;
    const debit = parseFloat(amount) < 0 ? Math.abs(amount) : 0;

    let newTransaction = false;
    if (!tx) {
      tx = await db.transaction(); // Start a new transaction
      newTransaction = true;
    }

    const ledgerEntry = {
      user_id: userId,
      round_id: roundId,
      transaction_type: type,
      entry: entry,
      credit: credit,
      debit: debit,
      amount: amount,
      status: "COMPLETED",
      stake_amount: amount,
      description: `${type} transaction`,
    };

    let newBalance = parseFloat(amount);

    if (userId) {
      const [userBalance] = await tx
        .select({ balance: columnTypeForUser })
        .from(users)
        .where(eq(users.id, userId));

      if (userBalance?.balance !== undefined) {
        newBalance += parseFloat(userBalance.balance);
      } else {
        logger.warn(
          `User balance not found for userId: ${userId}, using default amount.`
        );
      }
    }

    ledgerEntry[columnTypeForLedger] = newBalance.toFixed(2);

    await tx.insert(ledger).values(ledgerEntry);

    if (newTransaction) {
      await tx.commit(); // Comit if we created the transaction
    }
  } catch (err) {
    logger.error("Error while creating ledger entry:", err);
    if (tx) {
      await tx.rollback(); // Rollback only if transaction exists
    }
  }
}
