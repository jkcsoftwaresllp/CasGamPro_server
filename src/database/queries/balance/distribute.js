import { eq, sql } from "drizzle-orm";
import { db, pool } from "../../../config/db.js";
import { game_bets, user_limits_commissions, users, ledger } from "../../schema.js";

function roundTo2Decimals(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

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
    const isPlayerWin = netAmount > 0;
    let remainingAmount = roundTo2Decimals(Math.abs(netAmount));
    let currentUserId = userId;

    while (remainingAmount > 0) {
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
        const finalAmount = roundTo2Decimals(isPlayerWin ? -remainingAmount : remainingAmount);
        await updateAdminBalance(finalAmount);
        await createLedgerEntry(null, finalAmount, "ADMIN_PROFIT");
        break;
      }

      const parentId = parentInfo[0].parentId;
      const parentBalance = roundTo2Decimals(parentInfo[0].parentBalance);

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
        const shareAmount = roundTo2Decimals((remainingAmount * share) / 100);
        const finalShareAmount = roundTo2Decimals(isPlayerWin ? -shareAmount : shareAmount);
        const commissionAmount = roundTo2Decimals((totalBetAmount * commission) / 100);
        const totalParentAmount = roundTo2Decimals(finalShareAmount + commissionAmount);

        await updateParentBalance(parentId, totalParentAmount);

        if (commissionAmount > 0) {
          await createLedgerEntry(parentId, commissionAmount, "COMMISSION", {
            previousBalance: parentBalance,
            description: "Commission from bet amount"
          });
        }

        if (shareAmount !== 0) {
          await createLedgerEntry(
            parentId,
            finalShareAmount,
            isPlayerWin ? "LOSS_SHARE" : "PROFIT_SHARE",
            {
              previousBalance: roundTo2Decimals(parentBalance + commissionAmount),
              description: `Share from ${isPlayerWin ? 'loss' : 'profit'}`
            }
          );
        }

        remainingAmount = roundTo2Decimals(remainingAmount - shareAmount);
        currentUserId = parentId;
      }
    }
  } catch (error) {
    console.error("Error in profit/loss distribution:", error);
    throw error;
  }
}

async function updateParentBalance(parentId, amount) {
  const roundedAmount = roundTo2Decimals(amount);
  await db
    .update(users)
    .set({
      balance: sql`ROUND(balance + ${roundedAmount}, 2)`
    })
    .where(eq(users.id, parentId));
}

async function updateAdminBalance(amount) {
  const roundedAmount = roundTo2Decimals(amount);
  await db
    .update(users)
    .set({
      balance: sql`ROUND(balance + ${roundedAmount}, 2)`
    })
    .where(eq(users.role, 'ADMIN'));
}

async function createLedgerEntry(userId, amount, type, details = {}) {
  const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const roundedAmount = roundTo2Decimals(amount);
  const previousBalance = roundTo2Decimals(details.previousBalance || 0);
  const newBalance = roundTo2Decimals(previousBalance + roundedAmount);

  const entry = {
    user_id: userId,
    transaction_type: type,
    entry: `${type} - ${currentDate}`,
    amount: Math.abs(roundedAmount),
    credit: roundedAmount > 0 ? Math.abs(roundedAmount) : 0,
    debit: roundedAmount < 0 ? Math.abs(roundedAmount) : 0,
    previous_balance: previousBalance,
    new_balance: newBalance,
    status: "COMPLETED",
    description: details.description || `${type} transaction`,
    result: roundedAmount > 0 ? "WIN" : "LOSE"
  };

  await db.insert(ledger).values(entry);
}
