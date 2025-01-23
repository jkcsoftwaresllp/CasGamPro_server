import { db } from "../../config/db.js";
import { ledgerEntries } from "../../database/schema.js";

// Fetch paginated ledger entries
export const fetchLedgerEntries = async (userId, page, limit, filters) => {
  const query = db.select().from(ledgerEntries).where({ userId });

  const offset = (page - 1) * limit;

  // Apply filters dynamically
  if (filters.dateRange) {
    query.whereBetween("date", filters.dateRange);
  }
  if (filters.status) {
    query.where({ status: filters.status });
  }

  query.limit(limit).offset(offset).orderBy("date", "desc");

  return query;
};
