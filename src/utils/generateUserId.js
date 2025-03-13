import { format } from "date-fns";

export const generateUserId = (firstName) => {
  const now = new Date();
  const prefix = firstName.substring(0, 3).toUpperCase();
  const timestamp = format(now, "HHmmss");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}${timestamp}${random}`;
};