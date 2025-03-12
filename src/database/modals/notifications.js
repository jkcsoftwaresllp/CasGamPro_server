import { mysqlTable, int, timestamp, text } from "drizzle-orm/mysql-core";
import { users } from "./user";

// Notifications Table
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  user_id: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});
