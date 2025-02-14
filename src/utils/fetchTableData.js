import { db } from "../config/db.js";
import { sql, eq, and, gte, lte, like } from "drizzle-orm";
import { logToFolderError, logToFolderInfo } from "../utils/logToFolder.js";
import { tables } from "../data/tables.js"; // Ensure `tables` exports table schemas

export const fetchTableData = async (req, res) => {
  try {
    const {
      table: tableName, // Rename to avoid conflicts
      startDate,
      endDate,
      limit = 30,
      offset = 0,
      sortBy = "id",
      sortOrder = "ASC",
      ...filters // Dynamic filters
    } = req.query;

    // Validate table name
    if (!tableName || !tables[tableName]) {
      return res.status(400).json({
        uniqueCode: "CGP0053",
        message: "Invalid or missing table name",
      });
    }

    const tableSchema = tables[tableName]; // Get table schema
    const recordsLimit = Math.min(parseInt(limit) || 30, 100);
    const recordsOffset = parseInt(offset) || 0;

    // Build conditions
    let conditions = [];

    // Dynamic field filters
    for (const key in filters) {
      if (tableSchema[key]) {
        conditions.push(like(tableSchema[key], `%${filters[key]}%`));
      }
    }

    // Date filtering
    const formatDateForMySQL = (dateStr) => `${dateStr} 00:00:00`;

    if (startDate && tableSchema.created_at) {
      conditions.push(
        gte(tableSchema.created_at, sql`CAST(${formatDateForMySQL(startDate)} AS DATETIME)`)
      );
    }

    if (endDate && tableSchema.created_at) {
      conditions.push(
        lte(
          tableSchema.created_at,
          sql`CAST(${formatDateForMySQL(endDate).replace("00:00:00", "23:59:59")} AS DATETIME)`
        )
      );
    }

    // Validate sorting field
    const orderField = tableSchema[sortBy] || tableSchema.id;
    const orderDirection = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

    // Fetch data
    const results = await db
      .select()
      .from(tableSchema)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${orderField} ${sql.raw(orderDirection)}`)
      .limit(recordsLimit)
      .offset(recordsOffset);

    // Fetch total record count
    const totalRecords = await db
      .select({ count: sql`COUNT(*)` })
      .from(tableSchema)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Calculate next offset
    const nextOffset =
      recordsOffset + recordsLimit < totalRecords[0].count
        ? recordsOffset + recordsLimit
        : null;

    let response = {
      uniqueCode: "CGP0054",
      message: "Filtered records fetched successfully",
      data: { results, totalRecords: totalRecords[0].count, nextOffset },
    };

    logToFolderInfo("GeneralFilter/controller", "getFilteredRecords", response);
    return res.json(response);
  } catch (error) {
    let errorResponse = {
      uniqueCode: "CGP0055",
      message: "Internal Server Error",
      data: { error: error.message },
    };

    logToFolderError("GeneralFilter/controller", "getFilteredRecords", errorResponse);
    console.error("Error fetching filtered records:", error);
    return res.status(500).json(errorResponse);
  }
};
