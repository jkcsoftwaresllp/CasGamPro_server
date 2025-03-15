import { db } from "../config/db.js";

/**
 * Fetch a single record from a table by column value
 * @param {Object} table - Table schema reference
 * @param {string} column - Column name for filtering
 * @param {string | number} value - Column value to match
 * @returns {Promise<Object | undefined>}
 */
export const getOneByColumn = (table, column, value) => {
  return db
    .select()
    .from(table)
    .where(column, "=", value)
    .then((res) => res[0]); // Return a single record
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
export const getManyWithFilters = (
  table,
  columns,
  conditions = {},
  limit,
  offset
) => {
  let query = db.select(columns).from(table);

  // Apply filters dynamically
  Object.entries(conditions).forEach(([key, value]) => {
    query = query.where(key, "=", value);
  });

  return query.limit(limit).offset(offset);
};
