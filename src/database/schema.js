import { mysqlTable, int, varchar, boolean, timestamp, decimal, json, text, mysqlEnum, } from "drizzle-orm/mysql-core";

/*
 Changes:
  - Purpose of super agent's `min-bet` `max-bet`? 🮱
  - In agent table,`Total Clients` needed imo. 🮱
  - In agent table, "maximum" -> "max". 🮱
  - Removed `playerStats` table. 🮱
  - `game Image` not needed imo. DIRECTLY LINK THE GAME INSTEAD? 🮱
  - For consistency, we stick with camel case. 🮱
  - Rounds table changes: 
      - Improved *rounds* table format. 🮱
      - Referenced `gameId` (to link it to game). 🮱
      - Using `roundId` in *ledger* table. 🮱
      - Removed `gameId` from *bets* table since it is already using `roundId`. 🮱
  - Ensured no circular dependency for cascading.
  - Added index at appropriate places.
 
*/

// Enums
const Results = mysqlEnum("results", ["WIN", "TIE", "LOSE"]);
const Role = mysqlEnum("role", [ "SUPERADMIN", "ADMIN", "SUPERAGENT", "AGENT", "PLAYER", ]);
const BlockingLevels = mysqlEnum("blocking_levels", [ "LEVEL_1", "LEVEL_2", "LEVEL_3", "NONE", ]);
const RuleTypes = mysqlEnum("rule_types", ["CLIENT", "AGENT", "ADMIN"]);
const Languages = mysqlEnum("language", ["ENG", "HIN"]);

// Users table
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }),
  password: varchar("password", { length: 255 }).notNull(),
  role: Role.notNull(),
  blocking_levels: BlockingLevels.default("NONE").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});
//super Agent table

export const superAgents = mysqlTable("superAgents", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId") .notNull() .references(() => users.id, { onDelete: "cascade" }), // Each super-agent is linked to a user
  minBet: int("minBet").default(0).notNull(),
  maxBet: int("maxBet").default(0).notNull(),
});

// Agents table
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  superAgentId: int("superAgentsId").references(() => superAgents.id, { onDelete: "cascade", }),
  maxShare: decimal("maxShare", { precision: 10, scale: 2 }).default( 0.0 ),
  maxCasinoCommission: decimal("maxCasinoCommission", { precision: 10, scale: 2, }).default(0.0),
  maxLotteryCommission: decimal("maxLotteryCommission", { precision: 10, scale: 2, }).default(0.0),
  maxSessionCommission: decimal("maxSessionCommission", { precision: 10, scale: 2, }).default(0.0),
  fixLimit: decimal("fixLimit", { precision: 10, scale: 2 }).default(0.0),
  balance: decimal("balance", { precision: 10, scale: 2 }).default(0.0),
});

// Players table
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentId: int("agentId") .notNull() .references(() => agents.id, { onDelete: "cascade" }),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull(),
  fixLimit: decimal("fixLimit", { precision: 10, scale: 2 }),
  matchShare: decimal("matchShare", { precision: 10, scale: 2 }),
  lotteryCommission: decimal("lotteryCommission", { precision: 10, scale: 2 }),
  sessionCommission: decimal("sessionCommission", { precision: 10, scale: 2 }),
});

// Categories Table
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  thumbnail: varchar("thumbnail", { length: 255 }),
});

// Games Table
export const games = mysqlTable("games", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  thumbnail: varchar("thumbnail", { length: 255 }),
  categoryId: int("categoryId").notNull().references(() => categories.id),
});

// Favorite Games table (linked to users)
export const favoriteGames = mysqlTable("favoriteGames", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameId: int('gameId').notNull().references(() => games.id),
});

// Rounds Table
export const rounds = mysqlTable("rounds", {
  id: int("id").autoincrement().primaryKey(),
  gameId: int('gameId').notNull().references(() => games.id),
  playerA: json("playerA"), // array
  playerB: json("playerB"), // array
  playerC: json("playerC"), // array
  playerD: json("playerD"), // array
  jokerCard: varchar("jokerCard", { length: 255 }).notNull(),
  blindCard: varchar("blindCard", { length: 255 }).notNull(),
  winner: json("winner"), // array, since there can be multiple winners;
  createdAt: timestamp("createdAt").defaultNow(),
});

// Bets table
export const bets = mysqlTable("bets", {
  id: int("id").autoincrement().primaryKey(),
  roundId: int("roundId").references(() => rounds.id, { onDelete: "cascade" }),
  playerId: int("playerId").notNull().references(() => players.id, { onDelete: "cascade" }),
  betAmount: int("betAmount").notNull(),
  betSide: varchar("betSide", { length: 255 }).notNull(),
  win: boolean("win"),
});

// Ledger table schema
export const ledger = mysqlTable("ledger", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  roundId: int("roundId").references(() => rounds.id),
  date: timestamp("date").notNull(),
  entry: varchar("entry", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  debit: decimal("debit", { precision: 10, scale: 2 }).default(0).notNull(),
  credit: decimal("credit", { precision: 10, scale: 2 }).default(0).notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["WIN", "LOSS", "BET_PLACED"]).notNull(),
  stakeAmount: decimal("stakeAmount", { precision: 10, scale: 2 }).notNull(),
  result: Results.notNull(),
});

// Rules Table
export const rules = mysqlTable("rules", {
  id: int("id").autoincrement().primaryKey(),
  ruleCode: varchar("ruleCode", { length: 255 }).unique().notNull(),
  type: RuleTypes.notNull(),
  language: Languages.notNull(),
  rule: text("rule").notNull(),
});

// Notifications Table
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});
