import { eq, desc } from "drizzle-orm";
import { db } from "../config/db.js";
import { ledgerEntries } from "../database/schema.js";
import { logger } from "../logger/logger.js";

export const handlePlayHistorySocket = (io) => {
  io.on("connection", (socket) => {
    logger.info(`User connected: ${socket.id}`);

    socket.on("join", (userId) => {
      if (!userId) {
        socket.emit("error", { message: "User ID is required." });
        return;
      }
      socket.join(userId);
      logger.info(`User ${userId} joined.`);
    });

    // Fetch play history data
    socket.on(
      "fetch-play-history",
      async ({
        userId,
        page = 1,
        limit = 20,
        sortBy = "date",
        sortOrder = "desc",
        filter = {},
      }) => {
        if (!userId) {
          socket.emit("error", {
            message: "User ID is required to fetch play history data.",
          });
          return;
        }

        try {
          // Fetch total count for pagination
          const total = await db
            .select({ total_count: "COUNT(*)" })
            .from(ledgerEntries)
            .where(eq(ledgerEntries.userId, userId));

          const totalCount = total[0]?.total_count || 0;
          const totalPages = Math.ceil(totalCount / limit);

          // Adjust the page if it exceeds totalPages (to return the last page)
          const adjustedPage = Math.min(page, totalPages) || 1;
          const offset = (adjustedPage - 1) * limit;

          // Build query for filtering (e.g., by game name or result)
          let query = eq(ledgerEntries.userId, userId);
          if (filter.gameName)
            query = query.and(eq(ledgerEntries.gameName, filter.gameName));
          if (filter.result)
            query = query.and(eq(ledgerEntries.result, filter.result));

          // Determine sorting (default by date)
          const sort = sortOrder === "desc" ? desc(sortBy) : sortBy;

          // Fetch transactions
          const transactions = await db
            .select()
            .from(ledgerEntries)
            .where(query)
            .orderBy(sort)
            .limit(limit)
            .offset(offset);

          // Emit play history data
          socket.emit("play-history-data", {
            transactions,
            pagination: {
              total: totalCount,
              totalPages,
              currentPage: adjustedPage,
            },
          });
        } catch (error) {
          logger.error("Error fetching play history data:", error);
          socket.emit("error", {
            message: "Failed to fetch play history data.",
          });
        }
      }
    );

    // Handle new play history entry (e.g., after a game concludes)
    socket.on("create-play-history", async (historyEntry) => {
      if (
        !historyEntry.userId ||
        !historyEntry.gameName ||
        !historyEntry.result ||
        !historyEntry.stake
      ) {
        socket.emit("error", { message: "Required fields are missing." });
        return;
      }

      const { userId, gameName, roundId, stake, result } = historyEntry;

      try {
        // Fetch the current balance of the user before the transaction
        const currentBalanceQuery = await db
          .select()
          .from(ledgerEntries)
          .where(eq(ledgerEntries.userId, userId))
          .orderBy(desc(ledgerEntries.date))
          .limit(1);

        const currentBalance =
          currentBalanceQuery.length > 0 ? currentBalanceQuery[0].balance : 0;

        let newBalance;
        let newEntry;

        // Process the bet (debit entry)
        if (result === "Bet Placed") {
          newBalance = currentBalance - stake;

          newEntry = await db.insert(ledgerEntries).values({
            userId: historyEntry.userId,
            gameName: historyEntry.gameName,
            roundId: historyEntry.roundId,
            stake: historyEntry.stake,
            result: "Bet Placed", // This is the state when the bet is placed
            balance: newBalance,
            oldBalance: currentBalance, // Store old balance before the bet
            date: new Date(),
          });
        }
        // Process the win (credit entry)
        else if (result === "Win") {
          const credit = historyEntry.credit; // Assuming 'credit' is passed when the user wins
          newBalance = currentBalance + credit;

          newEntry = await db.insert(ledgerEntries).values({
            userId: historyEntry.userId,
            gameName: historyEntry.gameName,
            roundId: historyEntry.roundId,
            stake: historyEntry.stake,
            result: "Win", // State when the user wins
            balance: newBalance,
            oldBalance: currentBalance, // Store old balance before the win
            credit: credit, // Store the winnings amount
            date: new Date(),
          });
        }
        // Process the loss (debit entry)
        else if (result === "Loss") {
          newBalance = currentBalance - stake;

          newEntry = await db.insert(ledgerEntries).values({
            userId: historyEntry.userId,
            gameName: historyEntry.gameName,
            roundId: historyEntry.roundId,
            stake: historyEntry.stake,
            result: "Loss", // State when the user loses
            balance: newBalance,
            oldBalance: currentBalance, // Store old balance before the loss
            date: new Date(),
          });
        }

        // Emit new entry to the connected user (real-time sync)
        socket.emit("play-history-created", newEntry);

        // Broadcast the updated play history to the user
        io.to(historyEntry.userId).emit("play-history-updated", newEntry);
      } catch (error) {
        logger.error("Error creating play history entry:", error);
        socket.emit("error", {
          message: "Failed to create play history entry.",
        });
      }
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });
};
