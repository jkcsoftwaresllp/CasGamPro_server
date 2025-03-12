import {
  mysqlTable,
  int,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/mysql-core";
import { users } from "./user.js";

export const user_permissions = mysqlTable("user_permissions", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  user_id: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  can_create_user: boolean("can_create_user").default(false),
  can_edit_user: boolean("can_edit_user").default(false),
  can_delete_user: boolean("can_delete_user").default(false),
  can_manage_games: boolean("can_manage_games").default(false),
  can_view_reports: boolean("can_view_reports").default(false),
  created_at: timestamp("created_at").defaultNow(),
});
