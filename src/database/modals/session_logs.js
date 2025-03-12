import { mysqlTable, varchar, timestamp, text } from "drizzle-orm/mysql-core";

import { users } from "./user.js";

export const session_logs = mysqlTable("session_logs", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  user_id: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "CASCADE" }),
  login_time: timestamp("login_time").defaultNow(),
  logout_time: timestamp("logout_time"),
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: text("user_agent"),
});
