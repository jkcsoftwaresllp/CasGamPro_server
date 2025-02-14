import { pool } from "../config/db.js";
import { logger } from "../logger/logger.js";

const buildQuery = (filters, pagination) => {
  let query = "SELECT * FROM games WHERE 1=1"; // Base query

  if (filters.date) {
    query += ` AND date = ?`;
  }
  if (filters.gameName) {
    query += ` AND game_name LIKE ?`;
  }
  if (filters.userId) {
    query += ` AND user_id = ?`;
  }
  if (filters.username) {
    query += ` AND username LIKE ?`;
  }
  if (filters.gameType) {
    query += ` AND game_type = ?`;
  }

  if (filters.sortBy) {
    query += ` ORDER BY ${filters.sortBy} ${filters.sortOrder || "ASC"}`;
  } else {
    query += ` ORDER BY date DESC`;
  }

  if (pagination.page && pagination.pageSize) {
    const offset = (pagination.page - 1) * pagination.pageSize;
    query += ` LIMIT ${pagination.pageSize} OFFSET ${offset}`;
  }

  return query;
};

export const fetchFilteredData = async (req, res) => {
  const {
    date,
    gameName,
    userId,
    username,
    gameType,
    sortBy,
    sortOrder,
    page,
    pageSize,
  } = req.query;

  const filters = {
    date,
    gameName,
    userId,
    username,
    gameType,
    sortBy,
    sortOrder,
  };

  const pagination = {
    page: page ? parseInt(page) : 1,
    pageSize: pageSize ? parseInt(pageSize) : 10,
  };

  try {
    const query = buildQuery(filters, pagination);
    const values = [
      filters.date,
      filters.gameName ? `%${filters.gameName}%` : undefined,
      filters.userId,
      filters.username ? `%${filters.username}%` : undefined,
      filters.gameType,
    ].filter(Boolean);

    const [rows] = await pool.query(query, values);

    return res.status(200).json({
      uniqueCode: "CGP0049",
      message: "Filtered data fetched successfully",
      data: rows,
    });
  } catch (error) {
    logger.error("Error fetching filtered data:", error);
    return res.status(500).json({
      uniqueCode: "CGP0050",
      message: "Internal Server Error",
      data: {},
    });
  }
};
