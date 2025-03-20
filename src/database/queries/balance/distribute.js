import { eq } from "drizzle-orm";
import { db, pool } from "../../../config/db.js";
import { game_bets, user_limits_commissions, users } from "../../schema.js";

export async function fetchBetsForRound(roundId) {
  return await db
    .select()
    .from(game_bets)
    .where(eq(game_bets.round_id, roundId));
}

export async function insertIntoLedger(payload) {
  await db
    .insert(ledger)
    .values(payload)
    .execute();
}

export async function getCasinoCut(childId) {
  //fetch parent_id
  const { parentId } = await db.select({ parentId: users.parent_id }).from(users);

  console.info(`Player #${childId}'s parent Id: ${parentId}`);

  // return corresponding share and commision
  return await db.select({
    share: user_limits_commissions.max_share,
    commision: user_limits_commissions.max_casino_commission,
  }).from(user_limits_commissions).where(eq(user_limits_commissions.user_id, parentId))
}

export async function distributeHierarchyProfits(userId, totalBetAmount, netAmount) {
  try {
    // If netAmount is positive, it's a player win (hierarchy loss)
    // If netAmount is negative, it's a player loss (hierarchy profit)
    const isPlayerWin = netAmount > 0;
    let remainingAmount = Math.abs(netAmount);
    let currentUserId = userId;

    while (remainingAmount > 0) {
      // Get parent info
      const parentInfo = await db
        .select({
          parentId: users.parent_id,
          parentRole: users.role,
          parentBalance: users.balance
        })
        .from(users)
        .where(eq(users.id, currentUserId))
        .limit(1);

      if (!parentInfo.length || !parentInfo[0].parentId) {
        // No more parents, remaining goes to admin
        const finalAmount = isPlayerWin ? -remainingAmount : remainingAmount;
        await updateAdminBalance(finalAmount);
        await createLedgerEntry(null, finalAmount, "ADMIN_PROFIT");
        break;
      }

      const parentId = parentInfo[0].parentId;
      const parentBalance = parentInfo[0].parentBalance;

      // Get parent's share and commission rates
      const parentRates = await db
        .select({
          share: user_limits_commissions.max_share,
          commission: user_limits_commissions.max_casino_commission
        })
        .from(user_limits_commissions)
        .where(eq(user_limits_commissions.user_id, parentId))
        .limit(1);

      if (parentRates.length) {
        const { share, commission } = parentRates[0];

        // Calculate share amount (affected by win/loss)
        const shareAmount = (remainingAmount * share) / 100;
        // Share is negative if player wins (hierarchy loses)
        const finalShareAmount = isPlayerWin ? -shareAmount : shareAmount;

        // Commission is always calculated on total bet amount (regardless of win/loss)
        const commissionAmount = (totalBetAmount * commission) / 100;

        // Total amount for parent combines share and commission
        const totalParentAmount = finalShareAmount + commissionAmount;

        // Update parent's balance
        await updateParentBalance(parentId, totalParentAmount);

        // Create detailed ledger entries
        if (commissionAmount > 0) {
          await createLedgerEntry(parentId, commissionAmount, "COMMISSION", {
            previousBalance: parentBalance,
            description: "Commission from bet amount"
          });
        }

        if (shareAmount !== 0) {
          await createLedgerEntry(parentId, finalShareAmount, isPlayerWin ? "LOSS_SHARE" : "PROFIT_SHARE", {
            previousBalance: parentBalance + commissionAmount,
            description: `Share from ${isPlayerWin ? 'loss' : 'profit'}`
          });
        }

        // Update remaining amount for next iteration
        remainingAmount -= shareAmount;
        currentUserId = parentId;
      }
    }
  } catch (error) {
    console.error("Error in profit/loss distribution:", error);
    throw error;
  }
}

async function updateParentBalance(parentId, amount) {
  await db
    .update(users)
    .set({
      balance: db.sql`balance + ${amount}`
    })
    .where(eq(users.id, parentId));
}

async function updateAdminBalance(amount) {
  await db
    .update(users)
    .set({
      balance: db.sql`balance + ${amount}`
    })
    .where(eq(users.role, 'ADMIN'));
}

async function createLedgerEntry(userId, amount, type, details = {}) {
  const entry = {
    user_id: userId,
    transaction_type: type,
    entry: `${type} - ${formatDate(new Date())}`,
    amount: Math.abs(amount), // Store absolute amount
    credit: amount > 0 ? Math.abs(amount) : 0,
    debit: amount < 0 ? Math.abs(amount) : 0,
    previous_balance: details.previousBalance || 0,
    new_balance: (details.previousBalance || 0) + amount,
    status: "COMPLETED",
    description: details.description || `${type} transaction`
  };

  await db.insert(ledger).values(entry);
}
