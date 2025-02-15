// import { GAME_CONFIGS } from "../../services/shared/config/types.js";

import { db } from "../../config/db.js";
import { categories } from "../../database/schema.js";
export const getGameTypes = async (req, res) => {
  try {
    console.log("Yeah")
    const categoriesData = await db.select().from(categories);

    const formattedData = categoriesData.map((category, index) => ({
      id: index + 1,
      betfairid: category.id,
      name: category.name,
      status: category.blocked ? "inActive" : "Active",
      actions: null, // This will be handled by UI
    }));

    res.status(200).json({
      uniqueCode: "CGP0109",
      message: "Game types fetched successfully",
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      uniqueCode: "CGP0110",
      message: "Error fetching game types",
      data: { error: error.message },
    });
  }
};
