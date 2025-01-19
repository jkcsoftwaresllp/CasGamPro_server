// validators.js
const validateLength = (value, min, max) => {
  if (typeof value !== "string") return false;
  return value.length >= min && value.length <= max;
};

const validateEnum = (value, allowedValues) => {
  return allowedValues.includes(value);
};

const validateText = (value) => {
  return /^[a-zA-Z\s]+$/.test(value);
};

const validateNumber = (value) => {
  return /^[0-9]+$/.test(value);
};

const validateRuleCodeFormat = (value) => {
  return /^[A-Z0-9_]+$/.test(value); // e.g., BSF3333_ADMIN_ENG
};

export {
  validateLength,
  validateEnum,
  validateText,
  validateNumber,
  validateRuleCodeFormat,
};
