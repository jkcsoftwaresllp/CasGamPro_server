export const getMinValueKeys = (obj) => {
  if (!obj || Object.keys(obj).length === 0) return null;

  let minVal = Math.min(...Object.values(obj));
  let result = {};

  for (let key in obj) {
    if (obj[key] === minVal) {
      result[key] = obj[key];
    }
  }

  return result;
};
