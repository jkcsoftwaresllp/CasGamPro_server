// validators.js
<<<<<<< HEAD
const validateLength = (value, min, max) => {
=======
export const validateLength = (value, min, max) => {
>>>>>>> origin/development
  if (typeof value !== "string") return false;
  return value.length >= min && value.length <= max;
};

<<<<<<< HEAD
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
=======
export const validateEnum = (value, allowedValues) => {
  return allowedValues.includes(value);
};

export const validateText = (value) => {
  return /^[a-zA-Z\s]+$/.test(value);
};

export const validateNumber = (value) => {
  return /^[0-9]+$/.test(value);
};

export const validateRuleCodeFormat = (value) => {
  return /^[A-Z0-9_]+$/.test(value); // e.g., BSF3333_ADMIN_ENG
};
>>>>>>> origin/development
