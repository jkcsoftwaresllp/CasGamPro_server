import { eq } from "drizzle-orm";
import { db } from "../../../config/db.js";
import { ledger, users } from "../../schema.js";
import socketManager from "../../../services/shared/config/socket-manager.js";
import { logger } from "../../../logger/logger.js";

export const transferBalance = async ({
  transaction = null,
  ownerId,
  balance,
  userId,
  ownerEntry = null,
  userEntry = null,
}) => {
  try {
    const balanceFloat = parseFloat(balance);

    return await db.transaction(async (tx1) => {
      const tx = transaction || tx1;

      // Fetch owner's balance first
      const [owner] = await tx
        .select({
          currentBalance: users.balance,
          userId: users.id,
          parentId: users.parent_id,
        })
        .from(users)
        .where(eq(users.id, ownerId))
        .limit(1);

      const [user] = await tx
        .select({
          currentBalance: users.balance,
          userId: users.id,
          parentId: users.parent_id,
        })
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

      if (user.userId !== owner.parentId && user.parentId !== owner.userId) {
        return {
          success: false,
          msg: `Do not have Parent Child Relationship`,
        };
      }

      const ownerBalance = parseFloat(owner.currentBalance);
      const userbalance = parseFloat(user.currentBalance);

      // Ensure owner has enough balance to transfer
      if (ownerBalance < balanceFloat) {
        return {
          success: false,
          msg: `Insufficient balance to create user with amount ${balanceFloat}`,
        };
      }

      // Deduct balance from owner
      await tx
        .update(users)
        .set({ balance: ownerBalance - balanceFloat })
        .where(eq(users.id, ownerId));

      // Add balance to users
      await tx
        .update(users)
        .set({ balance: userbalance + balanceFloat })
        .where(eq(users.id, userId));

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
        new_coins_balance: 0,
        new_exposure_balance: 0,
        new_wallet_balance: ownerLatestBalance, // After deduction
        stake_amount: 0,
        result: null,
        status: "PAID",
        description: entryForOwner,
      });

      const userLatestBalance = userbalance + balanceFloat;

      // Insert ledger entry for new user
      await tx.insert(ledger).values({
        user_id: userId,
        round_id: "null",
        transaction_type: "DEPOSIT",
        entry: entryForUser,
        new_coins_balance: 0,
        new_exposure_balance: 0,
        new_wallet_balance: userLatestBalance,
        stake_amount: 0,
        result: null,
        status: "PAID",
        description: entryForUser,
      });

      socketManager.broadcastWalletUpdate(ownerId, ownerLatestBalance);
      socketManager.broadcastWalletUpdate(userId, userLatestBalance);

      return {
        success: true,
        msg: `Successfully transferred ${balanceFloat} from ${ownerId} to ${userId}`,
        data: {
          ownerLatestBalance,
          userLatestBalance,
        },
      };
    });
  } catch (error) {
    logger.error("Error in transferBalance:", error);
    return {
      success: false,
      msg: error.message || "An unexpected error occurred during transfer",
    };
  }
};
