import { format, parse, isValid } from "date-fns";

export const formatDate = (date, inputFormat = "dd-MM-yyyy") => {
  let parsedDate;

  if (date instanceof Date) {
    parsedDate = date;
  } else if (typeof date === "number") {
    parsedDate = new Date(date);
  } else if (typeof date === "string") {
    parsedDate = parse(date, inputFormat, new Date());
  } else {
    throw new Error(
      "Invalid date input. Must be a string, Date object, or timestamp."
    );
  }

  if (!isValid(parsedDate)) {
    throw new Error("Invalid date format. Expected format: dd-MM-yyyy.");
  }

  return format(parsedDate, "dd-MM-yyyy"); // Always return in "dd-MM-yyyy" format
};
