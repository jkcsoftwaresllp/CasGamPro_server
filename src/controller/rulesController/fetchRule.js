import { db } from "../../config/db.js";
import { rules } from "../../database/schema.js";
import { logger } from "../../logger/logger.js";

export const fetchRule =async (req, res) => {
  const { language } = req.query;
  if (!["ENG", "HIN"].includes(language)) {
    return res.status(400).json({
      uniqueCode: "CGP0000I",
      message:
        'Invalid language. Supported languages are "English" and "Hindi".',
      data: { status: "error" },
    });
  }
  try {
    const result = await db.select().from(rules).where({ language });

    // Format the rules for the response
    const formattedRules = result.map((rule) => ({
      id: rule.id,
      rule: rule.rule,
      language: rule.language,
    }));

    return res.status(200).json({
      uniqueCode: "CGP0000J",
      success: true,
      data: formattedRules,
    });
  } catch (err) {
    logger.error("Error in fetching rule", err);
    res.status(500).json({
      uniqueCode: "CGP0000K",
      message: "Failed to fetch rule.",
      data: { success: false },
    });
  }
};