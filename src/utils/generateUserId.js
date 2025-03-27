// import { format } from "date-fns";

// export const generateUserId = (firstName) => {
//   const now = new Date();
//   const prefix = firstName.substring(0, 3).toUpperCase();
//   const timestamp = format(now, "HHmmss");
//   const random = Math.floor(Math.random() * 1000)
//     .toString()
//     .padStart(3, "0");
//   return `${prefix}${timestamp}${random}`;
// };

// Generate 6 Characters Id
export const generateUserId = (firstName) => {
  firstName = firstName.trim();
  let prefix = firstName.replace(/\s+/g, '').substring(0, 2).toUpperCase();
    while ( prefix.length < 2) {
      const randomLetter = String.fromCharCode(
        Math.floor(Math.random() * 26 + 65)
      );
      prefix += randomLetter;
    }
  // const prefix = firstName.substring(0, 2).toUpperCase();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
    const userId = `${prefix}${random}`;
    return userId;
};
