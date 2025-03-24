import { eq } from "drizzle-orm";
import { db } from "../../../config/db.js";
import {
  game_bets,
  user_limits_commissions,
  users,
} from "../../../database/schema.js";
import { logger } from "../../../logger/logger.js";
import { getBetMultiplier } from "./getBetMultiplier.js";
import socketManager from "../config/socket-manager.js";
import { createLedgerEntry } from "./resultHelper.js";
import { folderLogger } from "../../../logger/folderLogger.js";

export const getAllBets = async (roundId) => {
  return await db
    .select()
    .from(game_bets)
    .where(eq(game_bets.round_id, roundId));
};

export const getShareCommission = async (userId) => {
  const [data] = await db
    .select({
      share: user_limits_commissions.max_share,
      commission: user_limits_commissions.max_casino_commission,
    })
    .from(user_limits_commissions)
    .where(eq(user_limits_commissions.user_id, userId));

  return {
    share: parseFloat(data.share) * 0.01,
    commission: parseFloat(data.commission) * 0.01,
  };
};

const updateGameBetId = async (betId, amount) => {
  await db
    .update(game_bets)
    .set({
      win_amount: amount,
    })
    .where(eq(game_bets.id, betId));
};

const upadteDBUserCoulmn = async (userId, updateValue, updateColumn) => {
  await db
    .update(users)
    .set({
      [updateColumn]: updateValue,
    })
    .where(eq(users.id, userId));
};

const getUserBalanceAndParentId = async (userId) => {
  const [userData] = await db
    .select({
      balance: users.balance,
      coins: users.coins,
      exposure: users.exposure,
      parentId: users.parent_id,
    })
    .from(users)
    .where(eq(users.id, userId));
  return userData;
};

export const calculationForClients = async (
  allBets,
  winners,
  gameType,
  roundId
) => {
  // Step-1: Organize bets by userId
  const groupedBetsByUser = {};

  for (const bet of allBets) {
    if (!groupedBetsByUser[bet.user_id]) {
      groupedBetsByUser[bet.user_id] = {
        userId: bet.user_id,
        bets: [],
      };
    }

    groupedBetsByUser[bet.user_id].bets.push({
      betSide: bet.bet_side,
      betAmount: bet.bet_amount,
      betId: bet.id,
    });
  }

  const groupedBetsByUserArr = Object.values(groupedBetsByUser);

  const agentsPL = {};

  // Step-2: Getting Client's Data and its Agent Info
  for (const user of groupedBetsByUserArr) {
    // Get current balance from database
    const userData = await getUserBalanceAndParentId(user.userId);
    folderLogger("distribution", "profit-distribution").info(
      `----------- ${user.userId} -----------`
    );

    if (!userData) {
      logger.error(`No user found for userId: ${user.userId}`);
      continue;
    }

    // Step 2.1: Calculating credit & debit of the user
    let credited = 0, // 650
      debited = 0; // 800

    for (const bet of user.bets) {
      // 100, 50, 100 - > 150, 200, 400 -> 500
      debited += parseFloat(bet.betAmount); // Bet amount debited

      if (winners.includes(bet.betSide)) {
        const multiplier = await getBetMultiplier(gameType, bet.betSide);
        const winAmount = parseFloat(bet.betAmount) * parseFloat(multiplier);
        credited += winAmount; // Win amount credited
        const entry = `Winning Amount for placing bet on ${
          bet.betSide
        } of round ${roundId.slice(-4)}`;
        await createLedgerEntry(user.userId, winAmount, "WIN", roundId, entry);
        await updateGameBetId(bet.bet_id, winAmount);

        folderLogger("distribution", "profit-distribution").info(
          `Win - ${bet.betSide}: ${bet.betAmount} -> ${winAmount}`
        );
      } else {
        await updateGameBetId(bet.bet_id, 0);

        folderLogger("distribution", "profit-distribution").info(
          `Lose - ${bet.betSide}: ${bet.betAmount} -> 0`
        );
      }
    }

    // Update clients wallet if Amount is credited:
    if (credited > 0) {
      folderLogger("distribution", "profit-distribution").info(
        `Congratualtions!!!, You credited overall ${credited}`
      );
      const usernewBalance = credited + parseFloat(userData.balance);
      await upadteDBUserCoulmn(user.userId, usernewBalance, "balance");
      socketManager.broadcastWalletUpdate(user.userId, usernewBalance);
    }

    // Step 2.2: Adding Profit & Loss to Agent's
    if (!agentsPL[userData.parentId]) {
      agentsPL[userData.parentId] = {
        userId: userData.parentId,
        pl: 0,
      };
    }
    agentsPL[userData.parentId].pl += debited - credited;
  }

  return Object.values(agentsPL);
};

export const calculationForUpper = async (profitLoss, roundId) => {
  const upperPL = {};

  for (const user of profitLoss) {
    // Get current balance from database
    const userData = await getUserBalanceAndParentId(user.userId);

    if (!userData) {
      logger.error(`No user found for userId: ${user.userId}`);
      continue;
    }

    if (!upperPL[userData.parentId]) {
      upperPL[userData.parentId] = {
        userId: userData.parentId,
        pl: 0,
      };
    }

    upperPL[userData.parentId].pl += user.pl;
    const { share, commission } = await getShareCommission(user.userId);
    const amount = parseFloat(user.pl);
    let passToUpper = 0,
      keep = 0;

    if (user.pl >= 0) {
      // User is in Profit : Calculation based on Shared + Commission

      const amountWithCommission = Math.abs(amount) * commission;
      keep = amount * share + amountWithCommission;
      passToUpper = (amount - amountWithCommission) * (1 - share);

      folderLogger("distribution", "profit-distribution").info(
        `Profit - ${user.userId}: ${amount} | (${share}, ${commission}), keep: ${keep}, Transer: ${passToUpper}`
      );
    } else {
      // User is in Loss : Calculation based on Shared only
      keep = amount * share;
      passToUpper = amount * (1 - share);

      folderLogger("distribution", "profit-distribution").info(
        `Loss - ${user.userId}: ${amount} | (${share}), keep: ${keep}, Transer: ${passToUpper}`
      );
    }

    const entry = `${keep > 0 ? "Profit" : "Loss"} Amount of round ${roundId}`;
    const usernewCoinsBalance = parseFloat(userData.coins) + keep;
    const usernewExposureBalance = parseFloat(userData.exposure) + keep;

    await upadteDBUserCoulmn(user.userId, usernewCoinsBalance, "coins");
    await upadteDBUserCoulmn(user.userId, usernewExposureBalance, "exposure");
    await createLedgerEntry(user.userId, keep, "PROFIT_SHARE", roundId, entry);

    upperPL[userData.parentId].pl += passToUpper;
  }

  return Object.values(upperPL);
};

export const calculationForAdmin = async (adminData, roundId) => {
  const { userId, pl } = { adminData };

  const userData = await getUserBalanceAndParentId(userId);

  if (!userData) {
    logger.error(`No user found for userId: ${userId}`);
    return;
  }

  const entry = `${pl > 0 ? "Profit" : "Loss"} Amount of round ${roundId}`;
  const usernewCoinsBalance = parseFloat(userData.coins) + pl;
  const usernewExposureBalance = parseFloat(userData.exposure) + pl;

  folderLogger("distribution", "profit-distribution").info(
    `Loss - ${userId}: ${pl}, keep: ${pl}`
  );

  await upadteDBUserCoulmn(userId, usernewCoinsBalance, "coins");
  await upadteDBUserCoulmn(userId, usernewExposureBalance, "exposure");
  await createLedgerEntry(userId, keep, "PROFIT_SHARE", roundId, entry);
};
