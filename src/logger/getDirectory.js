import { dirname, join } from "path";
import { fileURLToPath } from "url";
import fs from "fs";

export const logsDirectory = (url) => {
  const __filename = fileURLToPath(url);
  const __dirname = dirname(__filename);

  const logsDir = join(__dirname, "../../logs");

  // Ensure the logs directory exists
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  return logsDir;
};
