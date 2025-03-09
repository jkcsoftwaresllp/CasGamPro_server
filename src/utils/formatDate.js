import { format, parse, isValid, parseISO } from "date-fns";

export const formatDate = (
  date1,
  inputFormat = "dd-MM-yyyy",
  outputFormat = "dd-MM-yyyy"
) => {
  let parsedDate;

  // console.log({date})

  const date = JSON.stringify(date1, null, 2);

  if (date instanceof Date) {
    parsedDate = new Date(date);
  } else if (typeof date === "number") {
    parsedDate = new Date(date);
  } else if (typeof date === "string") {
    return `${formatStringDate(date)} (${extractTime(date)})`;
  } else {
    console.error(
      "Invalid date input. Must be a string, Date object, or timestamp."
    );
    return "";
  }

  if (!isValid(parsedDate)) {
    console.error(`Invalid date format. Expected format: ${inputFormat}`);
    return "";
  }

  return format(parsedDate, outputFormat);
};

export const formatStringDate = (dateString, outputFormat = "dd-MM-yyyy") => {
  if (typeof dateString !== "string") {
    console.error("Invalid input: Date must be a string.");
    return "";
  }

  // Extract YYYY-MM-DD from ISO 8601 format (e.g., 2025-03-08T19:46:00.000Z)
  const isoMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return format(new Date(`${year}-${month}-${day}`), outputFormat);
  }

  // Extract DD-MM-YYYY format (e.g., 08-03-2025 or 8-3-2025)
  const customMatch = dateString.match(/(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (customMatch) {
    const [, day, month, year] = customMatch;
    return format(new Date(`${year}-${month}-${day}`), outputFormat);
  }

  console.error("Invalid date format:", dateString);
  return "";
};

export const extractTime = (dateString) => {
  if (typeof dateString !== "string") {
    console.error("Invalid input: Date must be a string.");
    return "";
  }

  // Extract HH:MM:SS from ISO format (2025-03-08T19:46:00.000Z)
  const timeMatch = dateString.match(/T(\d{2}):(\d{2}):\d{2}/);
  if (!timeMatch) {
    console.error("Invalid date format:", dateString);
    return "";
  }
  const time = timeMatch[0].slice(1).split(":");
  let [hours, minutes, sec] = time;
  hours = parseInt(hours, 10);
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert 24-hour to 12-hour format

  return `${hours}:${minutes}:${sec} ${period}`;
};
