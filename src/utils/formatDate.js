/**
 * timeZone: "Asia/Kolkata",
 */
export const formatDate = (dateInput, timeZone = "UTC") => {
  let parsedDate;

  if (dateInput instanceof Date) {
    parsedDate = dateInput; // Directly use Date object
  } else if (typeof dateInput === "number") {
    parsedDate = new Date(dateInput); // Convert timestamp to Date
  } else if (typeof dateInput === "string") {
    parsedDate = new Date(dateInput); // Convert ISO string to Date
  } else {
    console.error(
      "Invalid date input. Must be a Date object, timestamp, or string."
    );
    return "";
  }

  if (isNaN(parsedDate.getTime())) {
    console.error("Invalid date format.");
    return "";
  }

  // Format Date and Time in IST (Asia/Kolkata)
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Ensures AM/PM format
  });

  const formattedDate = formatter.format(parsedDate);
  let [date, time] = formattedDate.split(", ");
  const [dd, mm, yyyy] = date.split("/");
  date = `${dd}-${mm}-${yyyy}`;
  time = time.toUpperCase();

  return `${date} (${time})`;
};

export const convertToDelhiISO = (utcDateString) => {
  let parsedDate = new Date(utcDateString);

  if (isNaN(parsedDate.getTime())) {
    console.error("Invalid date input");
    return "";
  }

  // Convert UTC time to IST (UTC +5:30)
  parsedDate = new Date(parsedDate.getTime() + 5.5 * 60 * 60 * 1000);
  return parsedDate;
};
