import { db } from "../config/db.js";
import { ledgerEntries } from "../database/schema.js";

// Fetch paginated ledger entries
export async function fetchLedgerEntries(
  userId,
  page = 1,
  limit = 20,
  filters = {}
) {
  const offset = (page - 1) * limit;

  const query = db.select().from(ledgerEntries).where({ userId });

  // Apply filters dynamically
  if (filters.dateRange) {
    query.whereBetween("date", filters.dateRange);
  }
  if (filters.status) {
    query.where({ status: filters.status });
  }

  query.limit(limit).offset(offset).orderBy("date", "desc");;

  return query;
}
