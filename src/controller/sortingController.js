import { db } from "../config/db.js";
import { logger } from "../logger/logger.js";
import { eq, like, and } from "drizzle-orm";
import { games } from "../database/schema.js";

export const fetchFilteredData = async (req, res) => {
  const {
    date,
    gameName,
    userId,
    username,
    gameType,
    sortBy = "date",
    sortOrder = "DESC",
    page = 1,
    pageSize = 10,
  } = req.query;

  const filters = [];
  if (date) filters.push(eq(games.date, date));
  if (gameName) filters.push(like(games.game_name, `%${gameName}%`));
  if (userId) filters.push(eq(games.user_id, userId));
  if (username) filters.push(like(games.username, `%${username}%`));
  if (gameType) filters.push(eq(games.game_type, gameType));

  try {
    const offset = (page - 1) * pageSize;

    const data = await db
      .select()
      .from(games)
      .where(and(...filters))
      .orderBy(sortOrder === "ASC" ? games[sortBy] : games[sortBy].desc())
      .limit(pageSize)
      .offset(offset);

    return res.status(200).json({
      uniqueCode: "CGP0049",
      message: "Filtered data fetched successfully",
      data,
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
