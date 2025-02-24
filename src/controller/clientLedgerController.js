import { db } from "../config/db.js";
import { ledger, players, rounds } from "../database/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../logger/logger.js";

// Get client ledger entries
export const getClientLedger = async (req, res) => {
  try {
    const userId = req.session.userId;
    console.log('User ID:', userId);
    const { limit = 30, offset = 0 } = req.query;
    console.log('Query Params:', { limit, offset });  


    // Get detailed ledger entries with bet results
    const entries = await db
      .select({
        date: ledger.date,
        entry: ledger.entry,
        debit: ledger.debit,
        credit: ledger.credit,
        balance: ledger.balance,
        roundId: ledger.roundId,
        status: ledger.status,
        result: ledger.result,
        // Calculate running profit/loss
        profitLoss: sql`SUM(${ledger.credit} - ${ledger.debit}) OVER (ORDER BY ${ledger.date})`,
        // Include commission if applicable
        commission: sql`CASE 
          WHEN ${ledger.status} = 'BET_PLACED' 
          THEN ${ledger.amount} * (SELECT casinoCommission FROM players WHERE userId = ${userId}) / 100
          ELSE 0 
        END`
      })
      .from(ledger)
      .where(eq(ledger.userId, userId))
      .orderBy(desc(ledger.date))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

      console.log('Ledger entries fetched from DB:', entries);

    // Format response for UI
    const formattedEntries = entries.map((entry) => ({
      date: entry.date.toISOString(),
      entry: entry.entry,
      debit: entry.debit || 0,
      credit: entry.credit || 0,
      balance: entry.balance,
      profitLoss: parseFloat(entry.profitLoss) || 0,
      commission: parseFloat(entry.commission) || 0,
      roundId: entry.roundId,
      status: entry.status,
      result: entry.result
    }));

    // Log the data being sent to the frontend
    console.log("Data being sent to frontend:", {
      uniqueCode: "CGP0085",
      message: "Ledger entries fetched successfully",
      data: formattedEntries,
    });

    return res.status(200).json({
      uniqueCode: "CGP0085",
      message: "Ledger entries fetched successfully",
      data: formattedEntries,
    });
  } catch (error) {
    logger.error("Error fetching ledger entries:", error);
    return res.status(500).json({
      uniqueCode: "CGP0086",
      message: "Internal server error",
      data: {},
    });
  }
};

// Record bet placement in ledger
export const recordBetPlacement = async (userId, roundId, stakeAmount) => {
  const connection = await db.connection();

  try {
    await connection.beginTransaction();

    // Get current balance and commission rate
    const [player] = await db
      .select({
        id: players.id,
        balance: players.balance,
        commission: players.casinoCommission
      })
      .from(players)
      .where(eq(players.userId, userId));

    if (!player) {
      throw new Error("Player not found");
    }

    const newBalance = player.balance - stakeAmount;
    const commissionAmount = (stakeAmount * player.commission) / 100;

    // Update player balance
    await db
      .update(players)
      .set({ balance: newBalance })
      .where(eq(players.userId, userId));

    // Create ledger entry for bet placement
    await db.insert(ledger).values({
      userId,
      date: new Date(),
      entry: "Amount debited after placing bet",
      debit: stakeAmount,
      credit: 0,
      balance: newBalance,
      roundId,
      stakeAmount,
      status: "BET_PLACED",
      amount: commissionAmount // Store commission amount
    });

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    logger.error("Error recording bet placement:", error);
    throw error;
  } finally {
    connection.release();
  }
};

// Record bet result in ledger
export const recordBetResult = async (userId, roundId, isWinner, amount) => {
  const connection = await db.connection();

  try {
    await connection.beginTransaction();

    // Get current balance and commission rate
    const [player] = await db
      .select({
        id: players.id,
        balance: players.balance,
        commission: players.casinoCommission
      })
      .from(players)
      .where(eq(players.userId, userId));

    if (!player) {
      throw new Error("Player not found");
    }

    // Get original bet entry
    const [betEntry] = await db
      .select()
      .from(ledger)
      .where(eq(ledger.roundId, roundId))
      .where(eq(ledger.userId, userId))
      .where(eq(ledger.status, "BET_PLACED"));

    if (!betEntry) {
      throw new Error("Original bet entry not found");
    }

    let newBalance = player.balance;
    let debitAmount = 0;
    let creditAmount = 0;
    let status;
    let commissionAmount = 0;

    if (isWinner) {
      creditAmount = amount;
      newBalance += amount;
      status = "WIN";
      // Calculate commission on winnings
      commissionAmount = (amount * player.commission) / 100;
    } else {
      debitAmount = betEntry.stakeAmount;
      status = "LOSS";
      // Commission already calculated on bet placement
      commissionAmount = betEntry.amount;
    }

    // Update player balance
    await db
      .update(players)
      .set({ balance: newBalance })
      .where(eq(players.userId, userId));

    // Create ledger entry for win/loss
    await db.insert(ledger).values({
      userId,
      date: new Date(),
      entry: isWinner ? "Winning Allocated" : "Bet Lost",
      debit: debitAmount,
      credit: creditAmount,
      balance: newBalance,
      roundId,
      amount: commissionAmount,
      status,
      result: status
    });

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    logger.error("Error recording bet result:", error);
    throw error;
  } finally {
    connection.release();
  }
};
