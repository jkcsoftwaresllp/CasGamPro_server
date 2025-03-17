import {
  mysqlTable,
  int,
  timestamp,
  text,
  varchar,
} from "drizzle-orm/mysql-core";
import { users } from "./user.js";

// Notifications Table
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  user_id: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});
