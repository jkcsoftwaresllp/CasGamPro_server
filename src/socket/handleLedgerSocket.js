import { eq, desc } from "drizzle-orm";
import { db } from "../config/db.js";
import { ledgerEntries } from "../database/schema.js";
import { logger } from "../logger/logger.js";

export const handleLedgerSocket = (io) => {
  io.on("connection", (socket) => {
    logger.info(`User connected: ${socket.id}`);

    socket.on("join", (userId) => {
      if (!userId) {
        socket.emit("error", { message: "User ID is required ." });
        return;
      }
      socket.join(userId);
      logger.info(`User ${userId} joined `);
    });

    // Fetch ledger data
    socket.on("fetch-ledger", async ({ userId, page = 1, limit = 20 }) => {
      if (!userId) {
        socket.emit("error", {
          message: "User ID is required to fetch ledger data.",
        });
        return;
      }
      try {
        const offset = (page - 1) * limit;

        // Fetch transactions
        const transactions = await db
          .select()
          .from(ledgerEntries)
          .where(eq(ledgerEntries.userId, userId))
          .orderBy(desc(ledgerEntries.date))
          .limit(limit)
          .offset(offset);

        // Fetch total count for pagination
        const total = await db
          .select({ total_count: "COUNT(*)" })
          .from(ledgerEntries)
          .where(eq(ledgerEntries.userId, userId));

        const totalPages = Math.ceil((total[0]?.total_count || 0) / limit);

        // Emit ledger data
        socket.emit("ledger-data", {
          transactions,
          pagination: {
            total: total[0]?.total_count || 0,
            totalPages,
            currentPage: page,
          },
        });
      } catch (error) {
        logger.error("Error fetching ledger data:", error);
        socket.emit("error", { message: "Failed to fetch ledger data." });
      }
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });
};
