import { db } from "../config/db.js";
import { logger } from "../logger/logger.js";
import { formatDate } from "../utils/formatDate.js";
import { agents } from "../database/schema.js";
import { eq } from "drizzle-orm";

export const createInOutEntry = async (req, res) => {
  try {
    const {
      agentId,
      date,
      description,
      aya,
      gya,
      commPosative,
      commNegative,
      limit,
    } = req.body;

    // Validate required fields
    if (!agentId || !date || !description) {
      return res.status(400).json({
        uniqueCode: "CGP0085",
        message: "Agent ID, date and description are required",
        data: {},
      });
    }

    // Parse and validate date format
    let formattedDate;
    try {
      formattedDate = formatDate(date);
    } catch (error) {
      return res.status(400).json({
        uniqueCode: "CGP0086",
        message: "Invalid date format. Use DD-MM-YYYY",
        data: {},
      });
    }

    // Validate numeric fields
    const numericFields = { aya, gya, commPosative, commNegative, limit };
    for (const [field, value] of Object.entries(numericFields)) {
      if (value !== undefined && (isNaN(value) || value < 0)) {
        return res.status(400).json({
          uniqueCode: "CGP0087",
          message: `Invalid ${field} value. Must be a non-negative number`,
          data: {},
        });
      }
    }

    // Update agent record
    const result = await db
      .update(agents)
      .set({
        inoutDate: formattedDate,
        inoutDescription: description,
        aya: aya || 0,
        gya: gya || 0,
        commPositive: commPosative || 0,
        commNegative: commNegative || 0,
        limitValue: limit || 0,
      })
      .where(eq(agents.id, agentId));

    if (!result) {
      return res.status(404).json({
        uniqueCode: "CGP0090",
        message: "Agent not found",
        data: {},
      });
    }
    const updatedAgent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    if (!updatedAgent.length) {
      return res.status(404).json({
        uniqueCode: "CGP0091",
        message: "Failed to fetch updated agent data",
        data: {},
      });
    }

    return res.status(200).json({
      uniqueCode: "CGP0088",
      message: "In-Out entry updated successfully",
      data: {
        date: formattedDate,
        description: updatedAgent[0].inoutDescription,
        aya: updatedAgent[0].aya,
        gya: updatedAgent[0].gya,
        commPositive: updatedAgent[0].commPositive,
        commNegative: updatedAgent[0].commNegative,
        limit: updatedAgent[0].limitValue,
      },
    });
  } catch (error) {
    logger.error("Error updating in-out entry:", error);
    return res.status(500).json({
      uniqueCode: "CGP0089",
      message: "Internal server error",
      data: {},
    });
  }
};
