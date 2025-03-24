import { and, eq } from "drizzle-orm";
import { db } from "../config/db.js";

/**
 * Fetch a single record from a table by column value
 * @param {Object} table - Table schema reference
 * @param {string} column - Column name for filtering
 * @param {string | number} value - Column value to match
 * @returns {Promise<Object | undefined>}
 */
export const getOneByColumn = async (table, column, value) => {
  const result = await db
    .select()
    .from(table)
    .where(eq(table[column], value))
    .limit(1);

  return result[0];
};

/**
 * Fetch multiple records from a table with optional filters and pagination
 * @param {Object} table - Table schema reference
 * @param {Object} columns - Columns to select
 * @param {Object} conditions - Conditions for filtering
 * @param {number} limit - Pagination limit
 * @param {number} offset - Pagination offset
 * @returns {Promise<Array>}
 */
export const getManyWithFilters = async (
  table,
  columns,
  conditions = {},
  limit,
  offset
) => {
  let query = db.select(columns).from(table);

  // Apply filters dynamically
  const whereConditions = Object.entries(conditions).map(([key, value]) =>
    eq(table[key], value)
  );

  if (whereConditions.length > 0) {
    query = query.where(and(...whereConditions));
  }

  return query.limit(limit).offset(offset);
};
