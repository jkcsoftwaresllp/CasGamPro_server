import { folderLogger } from "../logger/folderLogger.js";
import { LOG_TYPES } from "./logTypes.js";
import "dotenv/config";
export const logToFolderError = (folderPath, fileName, data) => {
  const logType = process.env.LOG_TYPE;
  if (logType.includes(LOG_TYPES.Type1))
    folderLogger(folderPath, fileName).error(JSON.stringify(data, null, 2));
};

export const logToFolderInfo = (folderPath, fileName, data) => {
  const logType = process.env.LOG_TYPE;
  if (logType.includes(LOG_TYPES.Type2))
    folderLogger(folderPath, fileName).info(JSON.stringify(data, null, 2));
};
