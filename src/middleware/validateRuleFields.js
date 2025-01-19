import {
  validateLength,
  validateEnum,
  validateRuleCodeFormat,
} from "../utils/validators.js";
import { RULE_TYPES } from "../utils/ruleTypes.js";

export const validateRuleFields = (req) => {
  const { ruleCode, type, language, rule } = req.body;

  // Validate ruleCode
  if (!ruleCode || !validateRuleCodeFormat(ruleCode)) {
    return false; // Validation failed
  }

  // Validate type
  const validTypes = Object.values(RULE_TYPES);
  if (!validTypes.includes(type)) {
    return false; // Validation failed
  }

  // Validate language
  if (!language || !validateEnum(language, ["ENG", "HIN"])) {
    return false; // Validation failed
  }

  // Validate rule length
  if (!rule || !validateLength(rule, 10, 1000)) {
    return false; // Validation failed
  }

  return true; // All validations passed
};
