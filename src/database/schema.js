import {
  mysqlTable,
  int,
  varchar,
  boolean,
  timestamp,
  decimal,
  json,
  text,
  mysqlEnum,
  date,
} from "drizzle-orm/mysql-core";

// Enums
const Results = mysqlEnum("results", ["WIN", "TIE", "LOSE", "BET_PLACED"]);
const Role = mysqlEnum("role", [
  "SUPERADMIN",
  "ADMIN",
  "SUPERAGENT",
  "AGENT",
  "PLAYER",
]);
export const coinsLedgerType = mysqlEnum("coinsLedgerType", [
  "DEPOSIT",
  "WITHDRAWAL",
]);

// NOTE : Do not change the order of the Blocking Levels
export const BLOCKING_LEVELS = [
  "NONE", // Can do anything
  "LEVEL_1", // Comletely Blocked
  "LEVEL_2", // Cannot Place bets
  "LEVEL_3", // Cannot play Games
];

export const BlockingLevels = mysqlEnum("blocking_levels", BLOCKING_LEVELS);

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
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), // Each super-agent is linked to a user
  balance: decimal("balance", { precision: 10, scale: 2 }).default(0.0),
  minBet: int("minBet").default(0).notNull(),
  maxBet: int("maxBet").default(0).notNull(),
  maxCasinoCommission: decimal("maxCasinoCommission", {
    precision: 10,
    scale: 2,
  }).default(0.0),
  maxLotteryCommission: decimal("maxLotteryCommission", {
    precision: 10,
    scale: 2,
  }).default(0.0),
  maxSessionCommission: decimal("maxSessionCommission", {
    precision: 10,
    scale: 2,
  }).default(0.0),
});

// Agents table
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  superAgentId: int("superAgentsId")
    .notNull()
    .references(() => superAgents.id, { onDelete: "cascade" }),
  maxShare: decimal("maxShare", { precision: 10, scale: 2 }).default(0.0),
  maxCasinoCommission: decimal("maxCasinoCommission", {
    precision: 10,
    scale: 2,
  }).default(0.0),
  maxLotteryCommission: decimal("maxLotteryCommission", {
    precision: 10,
    scale: 2,
  }).default(0.0),
  maxSessionCommission: decimal("maxSessionCommission", {
    precision: 10,
    scale: 2,
  }).default(0.0),
  balance: decimal("balance", { precision: 10, scale: 2 }).default(0.0),
  // In-Out fields
  inoutDate: date("inout_date"),
  inoutDescription: text("inout_description"),
  aya: decimal("aya", { precision: 10, scale: 2 }).default(0.0),
  gya: decimal("gya", { precision: 10, scale: 2 }).default(0.0),
  commPositive: decimal("comm_positive", { precision: 10, scale: 2 }).default(
    0.0
  ),
  commNegative: decimal("comm_negative", { precision: 10, scale: 2 }).default(
    0.0
  ),
  limitValue: decimal("limit_value", { precision: 10, scale: 2 }).default(0.0),
});

// Players table
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  agentId: int("agentId")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull(),
  share: decimal("share", { precision: 10, scale: 2 }),
  lotteryCommission: decimal("lotteryCommission", { precision: 10, scale: 2 }),
  casinoCommission: decimal("casinoCommission", { precision: 10, scale: 2 }),
  sessionCommission: decimal("sessionCommission", { precision: 10, scale: 2 }),
  // New blocking fields
  agentBlocked: boolean("agentBlocked").default(false).notNull(),
  betsBlocked: boolean("betsBlocked").default(false).notNull(),
});

// Categories Table
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  thumbnail: varchar("thumbnail", { length: 255 }),
  blocked: boolean("blocked").default(false).notNull(),
});

// Games Table
export const games = mysqlTable("games", {
  id: int("id").autoincrement().primaryKey(),
  gameId: varchar("gameId", { length: 10 }).notNull(),
  gameType: varchar("gameType", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  thumbnail: varchar("thumbnail", { length: 255 }),
  categoryId: int("categoryId")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  blocked: boolean("blocked").default(false).notNull(),
  bettingDuration: int("bettingDuration").notNull().default(20000),
  cardDealInterval: int("cardDealInterval").notNull().default(3000),
});

//betSides table
export const betSides = mysqlTable("betSides", {
  id: int("id").autoincrement().primaryKey(),
  gameId: int("gameId")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  gameTypeId: varchar("gameTypeId", { length: 10 }).notNull(),
  betSide: varchar("betSide", { length: 20 }).notNull(),
});

//multipliers table
export const multipliers = mysqlTable("multipliers", {
  id: int("id").autoincrement().primaryKey(),
  gameId: int("gameId")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  betSideId: int("betSideId")
    .notNull()
    .references(() => betSides.id, { onDelete: "cascade" }),
  multiplier: decimal("multiplier", { precision: 5, scale: 2 }).notNull(),
});

// Favorite Games table (linked to users)
export const favoriteGames = mysqlTable("favoriteGames", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  gameType: varchar("gameType", { length: 255 })
    .notNull()
    .references(() => games.gameType, { onDelete: "cascade" }),
});

// Rounds Table
export const rounds = mysqlTable("rounds", {
  id: int("id").autoincrement().primaryKey(),
  roundId: varchar("roundId", { length: 255 }).notNull().unique(),
  gameId: int("gameId")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  playerA: json("playerA"),
  playerB: json("playerB"),
  playerC: json("playerC"),
  playerD: json("playerD"),
  jokerCard: varchar("jokerCard", { length: 3 }).notNull(),
  blindCard: varchar("blindCard", { length: 3 }).notNull(),
  winner: json("winner"),
  createdAt: timestamp("createdAt").defaultNow(),
});

// Bets table
export const bets = mysqlTable("bets", {
  id: int("id").autoincrement().primaryKey(),
  roundId: varchar("roundId", { length: 255 }).notNull(),
  playerId: int("playerId")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  betAmount: int("betAmount").notNull(),
  betSide: varchar("betSide", { length: 255 }).notNull(),
  win: int("win"),
});

// Ledger table schema
export const ledger = mysqlTable("ledger", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  roundId: varchar("roundId", { length: 255 }),
  date: timestamp("date").notNull(),
  entry: varchar("entry", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  debit: decimal("debit", { precision: 10, scale: 2 }).default(0).notNull(),
  credit: decimal("credit", { precision: 10, scale: 2 }).default(0).notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["PAID", "PENDING"]).notNull(),
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
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

//for collection report
export const cashLedger = mysqlTable("cashLedger", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  playerId: int("playerId")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  transactionType: mysqlEnum("transaction_type", ["GIVE", "TAKE"]).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["PENDING", "COMPLETED"])
    .default("PENDING")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const coinsLedger = mysqlTable("coinsLedger", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  agentId: int("agentId")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  type: coinsLedgerType.notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  previousBalance: decimal("previous_balance", {
    precision: 10,
    scale: 2,
  }).notNull(),
  newBalance: decimal("new_balance", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
