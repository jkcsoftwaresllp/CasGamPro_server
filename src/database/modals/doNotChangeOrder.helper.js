/**
 *
 * Warning : Do not change the order of the Array Elements
 *
 */

import { mysqlEnum } from "drizzle-orm/mysql-core";

export const LANGUAGE = ["ENG", "HIN"];
export const COINS_LEDGER_TYPE = ["DEPOSIT", "WIDTHDRAWL"]; // Wallet
export const STATUS = ["PENDING", "COMPLETED", "FAILED", "PAID"];
export const ROLES = ["ADMIN", "SUPERAGENT", "AGENT", "PLAYER"];
export const RESULTS = ["WIN", "TIE", "LOSE", "BET_PLACED"];
export const TRANSACTION_TYPES = [
  ...RESULTS,
  ...COINS_LEDGER_TYPE,
  "GIVE", // For Rs. Exposure
  "TAKE", // For Rs. Exposure
  "COMMISSION",
  // some more
  "PROFIT_SHARE",
  "LOSS_SHARE",
  "ADMIN_PROFIT",
];
export const BLOCKING_LEVELS = [
  "NONE", // Can do anything
  "LEVEL_1", // Comletely Blocked
  "LEVEL_2", // Cannot Place bets
  "LEVEL_3", // Cannot play Games
];
export const GAMEBLOCK = [
  "ACTIVE", // no games are blocked
  "BLOCKED", // by admin
  "RESTRICTED", // by superagent
  "LIMITED", // by agent
];

// MYSQL Enums
export const Results = mysqlEnum("results", RESULTS);
export const Roles = mysqlEnum("roles", ROLES);
export const RuleTypes = mysqlEnum("rule_types", ROLES);
export const coinsLedgerType = mysqlEnum("coinsLedgerType", COINS_LEDGER_TYPE);
export const BlockingLevels = mysqlEnum("blocking_levels", BLOCKING_LEVELS);
export const GamesBlockingLevels = mysqlEnum("blocked", GAMEBLOCK);
export const Languages = mysqlEnum("language", LANGUAGE);
export const Status = mysqlEnum("status", STATUS);
export const TransactionType = mysqlEnum("transaction_type", TRANSACTION_TYPES);
