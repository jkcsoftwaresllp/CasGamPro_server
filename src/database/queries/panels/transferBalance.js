import { eq } from "drizzle-orm";
import { db } from "../../../config/db.js";
import { ledger, users } from "../../schema.js";
import socketManager from "../../../services/shared/config/socket-manager.js";

export const transferBalance = async ({
  transaction = null,
  ownerId,
  balance,
  userId,
  ownerEntry = null,
  userEntry = null,
}) => {
  return await db.transaction(async (tx1) => {
    const tx = transaction || tx1;

    // Fetch owner's balance first
    const [owner] = await tx
      .select({ currentBalance: users.balance })
      .from(users)
      .where(eq(users.id, ownerId))
      .limit(1);

    const [user] = await tx
      .select({ currentBalance: users.balance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!owner) {
      return {
        success: false,
        msg: `Owner not found for ${ownerId}`,
      };
    }

    if (!user) {
      return {
        success: false,
        msg: `User not found for ${userId}`,
      };
    }

    const ownerBalance = owner.currentBalance;
    const userbalance = user.currentBalance;

    // Ensure owner has enough balance to transfer
    if (ownerBalance < balance) {
      return {
        success: false,
        msg: `Insufficient balance to create user with amount ${balance}`,
      };
    }

    // Deduct balance from owner
    await tx
      .update(users)
      .set({ balance: ownerBalance - balance })
      .where(eq(users.id, ownerId));

    // Fetch updated balance after the update
    const [updatedOwner] = await tx
      .select({ latestBalance: users.balance })
      .from(users)
      .where(eq(users.id, ownerId))
      .limit(1);

    const ownerLatestBalance = updatedOwner?.latestBalance;

    const entryForOwner =
      ownerEntry || `Balance Deducted for deposit in ${userId} Wallet`;
    const entryForUser =
      userEntry || `Balance is deposit in your Wallet from ${ownerId}`;

    // Insert ledger entry for owner's deduction
    await tx.insert(ledger).values({
      user_id: ownerId,
      round_id: null,
      transaction_type: "WITHDRAWAL",
      entry: entryForOwner,
      amount: balance,
      previous_balance: ownerBalance, // Before deduction
      new_balance: ownerLatestBalance, // After deduction
      stake_amount: 0,
      result: null,
      status: "PAID",
      description: entryForOwner,
    });

    const userLatestBalance = userbalance + balance;

    // Insert ledger entry for new user
    await tx.insert(ledger).values({
      user_id: userId,
      round_id: "null",
      transaction_type: "DEPOSIT",
      entry: entryForUser,
      amount: balance,
      previous_balance: userbalance,
      new_balance: userLatestBalance,
      stake_amount: 0,
      result: null,
      status: "PAID",
      description: entryForUser,
    });

    socketManager.broadcastWalletUpdate(ownerId, ownerLatestBalance);
    socketManager.broadcastWalletUpdate(userId, userLatestBalance);

    return {
      success: true,
      msg: `Successfully transferred ${balance} from ${ownerId} to ${userId}`,
      data: {
        ownerLatestBalance,
        userLatestBalance,
      },
    };
  });
};
