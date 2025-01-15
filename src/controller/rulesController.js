import { db } from "../config/db.js";
import { rules } from "../database/schema.js";
export const rulesController = {
  //create a new rule
  createRule: async (req, res) => {
    try {
      const { ruleCode, type, language, rule } = req.body;
      if (!ruleCode || !type || !language || !rule) {
        return res
          .status(400)
          .json({ success: false, message: "All fields are required." });
      }

      await db.insert(rules).value({ ruleCode, type, language, rule });
      res
        .status(201)
        .json({ success: true, message: "Rule created successfully." });
    } catch (err) {
      console.error("Error in creating rule", err);
      res
        .status(500)
        .json({ success: false, message: "Failed to create rule." });
    }
  },

  //update an existing rule
  updateRule: async (req, res) => {
    try {
      const { ruleCode } = req.params;
      const update = req.body;
      const result = await db
        .update(rules)
        .set(update)
        .where(rules.ruleCode.eq(ruleCode));

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Rule not found." });
      }
      res
        .status(200)
        .json({ success: true, message: "Rule updated successfully." });
    } catch (err) {
      console.error("Error in updating rule", err);
      res
        .status(500)
        .json({ success: false, message: "Failed to update rule." });
    }
  },
  //Fetch rule
  fetchRule: async (req, res) => {
    try {
      const { type, language } = req.query;
      let query = db.select().from(rules);
      if (type) query = query.where(rules.type.eq(type));
      if (language) query = query.where(rules.language.eq(language));
      const result = await query;
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error("Error in fetching rule", err);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch rule." });
    }
  },
  //Delete rule
  deleteRule: async (req, res) => {
    try {
      const { ruleCode } = req.params;

      const result = await db.delete(rules).where(rules.ruleCode.eq(ruleCode));

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Rule not found." });
      }
      res
        .status(200)
        .json({ success: true, message: "Rule deleted successfully." });
    } catch (err) {
      console.error("Error in deleting rule", err);
      res
        .status(500)
        .json({ success: false, message: "Failed to delete rule." });
    }
  },
};
