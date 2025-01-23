import { logger } from "../logger/logger.js";
import { fetchLedgerEntries } from "../utils/ledgerEntries/index.js";

export function handleLedgerSocket(io) {
  io.on("connection", (socket) => {
    logger.info("Client connected to Ledger Service");

    socket.on("fetch_ledger", async ({ userId, page, filters }) => {
      try {
        const data = await fetchLedgerEntries(userId, page, 20, filters);
        socket.emit("ledger_data", data);
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // Listen for real-time updates and broadcast changes
    socket.on("new_transaction", (transaction) => {
      io.to(`user_${transaction.userId}`).emit(
        "transaction_update",
        transaction
      );
    });
  });
}
