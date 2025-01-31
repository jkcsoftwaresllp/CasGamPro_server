import { pool } from "../config/db.js";
import { logger } from "../logger/logger.js";
import redis from "../config/redis.js"

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
    query += ` ORDER BY ${filters.sortBy} ${filters.sortOrder || 'ASC'}`;
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
  const { date, gameName, userId, username, gameType, sortBy, sortOrder, page, pageSize } = req.query;

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

  // Cache key based on filters and pagination
  const cacheKey = `filtered_data:${JSON.stringify(filters)}:${pagination.page}:${pagination.pageSize}`;

  // Check if data is cached
  const cachedData = await redis.get(cacheKey);
  if (cachedData) {
    return res.status(200).json({
      uniqueCode: "CGP0047",
      message: "Data fetched from cache",
      data: JSON.parse(cachedData),
    });
  }

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

    // Cache the data for future use
    redis.setex(cacheKey, 3600, JSON.stringify(rows)); // Cache for 1 hour

    return res.status(200).json({
      uniqueCode: "CGP0045",
      message: "Filtered data fetched successfully",
      data: rows,
    });
  } catch (error) {
    logger.error("Error fetching filtered data:", error);
    return res.status(500).json({
      uniqueCode: "CGP0046",
      message: "Internal Server Error",
      data: {},
    });
  }
};
