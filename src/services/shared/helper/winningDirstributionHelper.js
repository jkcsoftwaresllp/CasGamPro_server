import { eq, inArray } from "drizzle-orm";
import { db } from "../../../config/db.js";
import {
  amount_distribution,
  game_bets,
  user_limits_commissions,
  users,
} from "../../../database/schema.js";
import { logger } from "../../../logger/logger.js";
import { getBetMultiplier } from "./getBetMultiplier.js";
import socketManager from "../config/socket-manager.js";
import { folderLogger } from "../../../logger/folderLogger.js";
import { createLedgerEntry } from "../../../database/queries/panels/createLedgerEntry.js";

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

const getMultipleUserBalanceAndParentId = async (userIds) => {
  const userData = await db
    .select({
      userId: users.id,
      balance: users.balance,
      coins: users.coins,
      exposure: users.exposure,
      parentId: users.parent_id,
    })
    .from(users)
    .where(inArray(users.id, userIds));

  // Convert array to a dictionary for quick lookup
  return Object.fromEntries(userData.map((user) => [user.userId, user]));
};

export const getMultipleShareCommission = async (userIds) => {
  const data = await db
    .select({
      userId: user_limits_commissions.user_id,
      share: user_limits_commissions.max_share,
      commission: user_limits_commissions.max_casino_commission,
    })
    .from(user_limits_commissions)
    .where(inArray(user_limits_commissions.user_id, userIds));

  // Convert array to a dictionary with formatted values
  return Object.fromEntries(
    data.map((user) => [
      user.userId,
      {
        share: parseFloat(user.share) * 0.01,
        commission: parseFloat(user.commission) * 0.01,
      },
    ])
  );
};

export const insertAmountDistribution = async ({
  roundId,
  userId,
  role,
  betAmount,
  shareAmount,
  commissionAmount,
  keep,
  pass,
}) => {
  try {
    await db.insert(amount_distribution).values({
      round_id: roundId,
      user_id: userId,
      roles: role,
      bet_amount: betAmount,
      share: shareAmount,
      commission: commissionAmount,
      keep,
      pass,
    });
  } catch (error) {
    logger.error(`Error inserting amount distribution record:`, error);
  }
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
  const userIds = groupedBetsByUserArr.map((user) => user.userId);

  // Step-2: Batch Fetch All User Data & Agent Info
  const userBalances = await getMultipleUserBalanceAndParentId(userIds);

  // Track Agent's Profit/Loss and Total Bet Amount
  const agentsPL = {};
  const agentBetAmounts = {}; // New object to track total bets per agent

  for (const user of groupedBetsByUserArr) {
    const userData = userBalances[user.userId];

    if (!userData) {
      logger.error(`No user found for userId: ${user.userId}`);
      continue;
    }

    // folderLogger("distribution", "profit-distribution").info(
    //   `----------- ${user.userId} -----------`
    // );

    // Step 2.1: Calculating credit & debit of the user
    let credited = 0,
      debited = 0;

    for (const bet of user.bets) {
      debited += parseFloat(bet.betAmount);

      if (winners.includes(bet.betSide)) {
        const multiplier = await getBetMultiplier(gameType, bet.betSide);
        const winAmount = parseFloat(bet.betAmount) * parseFloat(multiplier);
        credited += winAmount;

        const entry = `Winning Amount for placing bet on ${
          bet.betSide
        } of round ${roundId.slice(-4)}`;
        await createLedgerEntry({
          userId: user.userId,
          amount: winAmount.toFixed(2),
          type: "DEPOSIT",
          roundId,
          entry,
          balanceType: "wallet",
          previousBalanceAddOn: credited,
        });
        await updateGameBetId(bet.betId, winAmount.toFixed(2));

        // folderLogger("distribution", "profit-distribution").info(
        //   `Win - ${bet.betSide}: ${bet.betAmount} -> ${winAmount.toFixed(2)}`
        // );
      } else {
        await updateGameBetId(bet.betId, 0);

        // folderLogger("distribution", "profit-distribution").info(
        //   `Lose - ${bet.betSide}: ${bet.betAmount} -> 0`
        // );
      }
    }

    // Step 2.2: Update client wallet
    if (credited > 0) {
      // folderLogger("distribution", "profit-distribution").info(
      //   `Congratulations!!! You credited overall ${credited.toFixed(
      //     2
      //   )} and debited ${debited.toFixed(2)}`
      // );
      const newBalance = credited + parseFloat(userData.balance);
      await upadteDBUserCoulmn(user.userId, newBalance.toFixed(2), "balance");
      socketManager.broadcastWalletUpdate(user.userId, newBalance.toFixed(2));
    }

    // Step 2.3: Adding Profit & Loss to Agent's
    if (!agentsPL[userData.parentId]) {
      agentsPL[userData.parentId] = { userId: userData.parentId, pl: 0 };
    }
    agentsPL[userData.parentId].pl += debited - credited;

    // Step 2.4: Track total bet amount per Agent
    if (!agentBetAmounts[userData.parentId]) {
      agentBetAmounts[userData.parentId] = 0;
    }
    agentBetAmounts[userData.parentId] += debited; // Sum of all bet amounts under this agent
  }

  // Combine both objects into the final result
  return Object.keys(agentsPL).map((agentId) => ({
    userId: agentId,
    pl: agentsPL[agentId].pl,
    totalBetAmount: agentBetAmounts[agentId] || 0, // Ensure it returns 0 if no bets exist
  }));
};

export const calculationForUpper = async (
  profitLoss,
  roundId,
  isSecondCall = false
) => {
  try {
    const upperPL = {};

    // Step 1: Batch Fetch All User Data & Share/Commission
    const userIds = profitLoss.map((user) => user.userId);
    const userBalances = await getMultipleUserBalanceAndParentId(userIds); // Batch query
    const userShares = await getMultipleShareCommission(userIds); // Batch query

    const role = isSecondCall ? "SUPERAGENT" : "AGENT"; // Set role based on call

    // Step 2: Process Each User
    for (const user of profitLoss) {
      const userData = userBalances[user.userId]; // Get user data from batch
      const { share, commission } = userShares[user.userId]; // Get share/commission from batch

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

      const amount = parseFloat(user.pl);
      let passToUpper = 0,
        keep = 0,
        shareAmount = 0,
        commissionAmount = 0;

      if (user.pl >= 0) {
        commissionAmount = Math.abs(amount) * commission;
        shareAmount = amount * share;
        keep = shareAmount + commissionAmount;
        passToUpper = (amount - commissionAmount) * (1 - share);
      } else {
        shareAmount = amount * share;
        keep = shareAmount;
        passToUpper = amount * (1 - share);
      }

      // folderLogger("distribution", "profit-distribution").info(
      //   `${user.pl >= 0 ? "Profit" : "Loss"} - ${user.userId}: ${amount.toFixed(
      //     2
      //   )} | (${share}, ${commission}), keep: ${keep.toFixed(
      //     2
      //   )}, Transfer: ${passToUpper.toFixed(2)}`
      // );

      // Step 3: Prepare Bulk Updates
      const entry = `${
        keep > 0 ? "Profit" : "Loss"
      } Amount of round ${roundId}`;
      const usernewCoinsBalance = parseFloat(userData.coins) + keep;
      const usernewExposureBalance = parseFloat(userData.exposure) + keep;

      await Promise.all([
        upadteDBUserCoulmn(
          user.userId,
          usernewCoinsBalance.toFixed(2),
          "coins"
        ),
        upadteDBUserCoulmn(
          user.userId,
          usernewExposureBalance.toFixed(2),
          "exposure"
        ),
        createLedgerEntry({
          userId: user.userId,
          amount: keep.toFixed(2),
          type: "COMMISSION",
          roundId,
          entry,
          balanceType: "coins",
        }),
        createLedgerEntry({
          userId: user.userId,
          amount: keep.toFixed(2),
          type: keep.toFixed(2) > 0 ? "GIVE" : "TAKE",
          roundId,
          entry,
          balanceType: "exposure",
        }),
        insertAmountDistribution({
          roundId,
          userId: user.userId,
          role,
          betAmount: isSecondCall ? 0 : user.totalBetAmount || 0,
          shareAmount: shareAmount.toFixed(2),
          commissionAmount: commissionAmount.toFixed(2),
          keep: keep.toFixed(2),
          pass: passToUpper.toFixed(2),
        }),
      ]);

      // Step 4: Assign Pass-to-Upper PL
      upperPL[userData.parentId].pl += passToUpper;
    }

    return Object.keys(upperPL).map((agentId) => ({
      userId: agentId,
      pl: upperPL[agentId].pl,
      totalBetAmount: null, // Can be skipped if unnecessary
    }));
  } catch (err) {
    logger.error("Error while processing Upper Hierarchy Result: ", err);
  }
};
export const calculationForAdmin = async (adminData, roundId) => {
  try {
    if (!adminData || adminData.length === 0) {
      return;
    }

    const { userId, pl } = adminData[0];

    const userData = await getUserBalanceAndParentId(userId);

    if (!userData) {
      logger.error(`No user found for userId: ${userId}`);
      return;
    }

    const finalPL = parseFloat(pl);

    const entry = `${
      finalPL > 0 ? "Profit" : "Loss"
    } Amount of round ${roundId}`;

    const userNewCoinsBalance = parseFloat(userData.coins) + finalPL;
    const userNewExposureBalance = parseFloat(userData.exposure) + finalPL;

    // folderLogger("distribution", "profit-distribution").info(
    //   `${finalPL > 0 ? "Profit" : "Loss"} - ${userId}: ${finalPL.toFixed(
    //     2
    //   )}, keep: ${finalPL.toFixed(2)}`
    // );

    await Promise.all([
      upadteDBUserCoulmn(userId, userNewCoinsBalance.toFixed(2), "coins"),
      upadteDBUserCoulmn(userId, userNewExposureBalance.toFixed(2), "exposure"),
      createLedgerEntry({
        userId: userId,
        amount: finalPL.toFixed(2),
        type: "COMMISSION",
        roundId,
        entry,
        balanceType: "coins",
      }),
      createLedgerEntry({
        userId: userId,
        amount: finalPL.toFixed(2),
        type: finalPL > 0 ? "GIVE" : "TAKE",
        roundId,
        entry,
        balanceType: "exposure",
      }),
      // Insert into amount_distribution table
      insertAmountDistribution({
        roundId,
        userId,
        role: "ADMIN",
        betAmount: 0,
        shareAmount: finalPL.toFixed(2),
        commissionAmount: "0.00",
        keep: finalPL.toFixed(2),
        pass: "0.00", // No pass-to-upper since Admin is the last level
      }),
    ]);
  } catch (err) {
    logger.error("Error while processing Admin Result: ", err);
  }
};
