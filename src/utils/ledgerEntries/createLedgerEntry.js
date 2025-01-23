import { db } from "../config/db.js";
import { ledgerEntries, players } from "../database/schema.js";
export async function createTransaction({
  userId,
  gameSessionId,
  entry,
  amount,
  debit = null,
  credit = null,
  status,
}) {
  // Validate that debit and credit are not non-null simultaneously
  if (debit && credit) {
    throw new Error("Both credit and debit cannot be non-null simultaneously.");
  }

  // Fetch the user's current balance
  const user = await db.select(players.balance).from(players).where({ id: userId }).first();
  if (!user) throw new Error("Invalid user ID");

  let newBalance = user.balance;

  // Update the balance based on the transaction
  if (debit) newBalance -= debit;
  if (credit) newBalance += credit;

  // Ensure balance does not go negative (optional, based on business rules)
  if (newBalance < 0) {
    throw new Error("Insufficient balance for the transaction.");
  }

  // Insert the transaction into the ledger
  await db.insert(ledgerEntries).values({
    userId,
    gameSessionId,
    date: new Date(),
    entry,
    amount,
    debit,
    credit,
    balance: newBalance,
    status,
  });

  // Update the user's balance in the players table
  await db.update(players).set({ balance: newBalance }).where({ id: userId });
}