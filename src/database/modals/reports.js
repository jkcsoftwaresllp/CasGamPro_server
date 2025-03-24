import { mysqlTable, varchar, timestamp, json } from "drizzle-orm/mysql-core";

export const reports = mysqlTable("reports", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  report_type: varchar("report_type", { length: 255 }).notNull(), // DAILY_SALES, USER_BETS, GAME_STATS
  report_data: json("report_data").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});
