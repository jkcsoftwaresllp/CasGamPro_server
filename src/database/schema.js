import {
  mysqlTable,
  int,
  varchar,
  boolean,
  timestamp,
  decimal,
  json,
  mysqlEnum,
  text,
} from "drizzle-orm/mysql-core";
  

// Users table
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }),
  password: varchar("password", { length: 255 }).notNull(),
  blocked: boolean("blocked"),
  role: mysqlEnum("role", ["SUPERADMIN", "ADMIN", "AGENT", "PLAYER"]).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Agents table
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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
  balance: int("balance").notNull(),
  fixLimit: int("fixLimit"),
  matchShare: decimal("matchShare", { precision: 10, scale: 2 }),
  lotteryCommission: decimal("lotteryCommission", { precision: 10, scale: 2 }),
  sessionCommission: decimal("sessionCommission", { precision: 10, scale: 2 }),
});

// Player Stats table
export const playerStats = mysqlTable("player_stats", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  totalBets: int("totalBets").default(0),
  totalWins: int("totalWins").default(0),
  totalBetAmount: int("totalBetAmount").default(0),
  totalWinnings: decimal("totalWinnings", { precision: 10, scale: 2 }).default(
    "0.00"
  ),
  gamesPlayed: int("gamesPlayed").default(0),
  lastUpdated: timestamp("lastUpdated").defaultNow(),
});

// Rounds table
export const rounds = mysqlTable("rounds", {
  id: int("id").autoincrement().primaryKey(),
  game: varchar("game", { length: 255 }).notNull(),
  cards: json("cards").notNull(),
  blindCard: varchar("blindCard", { length: 255 }).notNull(),
  result: mysqlEnum("result", ["WIN", "TIE", "LOSE"]).notNull(),
});

// Bets table
export const bets = mysqlTable("bets", {
  id: int("id").autoincrement().primaryKey(),
  roundId: int("roundId").references(() => rounds.id, { onDelete: "cascade" }),
  gameId: varchar("gameId", { length: 255 }),
  playerId: int("playerId")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  betAmount: int("betAmount").notNull(),
  betSide: varchar("betSide", { length: 255 }).notNull(),
  win: boolean("win"),
});

// Rules table
export const rules = mysqlTable("rules", {
  id: int("id").autoincrement().primaryKey(), // Primary Key
  ruleCode: varchar("ruleCode", { length: 255 }).unique().notNull(), // Unique Rule Code
  type: mysqlEnum("type", ["CLIENT", "AGENT", "ADMIN"]).notNull(), // Rule Type
  language: mysqlEnum("language", ["ENG", "HIN"]).notNull(), // Language
  rule: text("rule").notNull(), // Rule Text
});

// Favorite Games table (linked to users)
export const favoriteGames = mysqlTable("favorite_games", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), // Reference to user
  totalPlayTime: varchar("totalPlayTime", { length: 50 }), // New column for total play time
  gameImg: varchar("gameImg", { length: 255 }), // New column for game image URL
});

// Notifications table

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
// Games table schema
export const games = mysqlTable("games", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  thumbnail: varchar("thumbnail", { length: 255 }).notNull(),
  description: text("description").notNull(),
  rules: text("rules").notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});
