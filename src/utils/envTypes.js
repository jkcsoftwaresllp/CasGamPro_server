import { config } from "dotenv";

// Load .env variables
config();

export const ENV_GAME_NAMES = process.env.GAME_NAMES
  ? process.env.GAME_NAMES.split(",")
  : [];

export const ENV_LOG_TYPE = process.env.LOG_TYPE
  ? process.env.LOG_TYPE.split(",")
  : "Type-0";

export const ENV_TYPE_1 = "Type-1";
export const ENV_TYPE_2 = "Type-2";
export const ENV_TYPE_3 = "Type-3";
export const ENV_TYPE_4 = "Type-4";
export const ENV_TYPE_5 = "Type-5";
