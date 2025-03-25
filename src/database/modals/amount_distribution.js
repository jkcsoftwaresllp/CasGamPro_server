import {
  mysqlTable,
  varchar,
  decimal,
  timestamp,
  int,
} from "drizzle-orm/mysql-core";
import { Roles } from "./doNotChangeOrder.helper.js";
import { game_rounds } from "./gameRounds.js";
import { users } from "./user.js";

export const amount_distribution = mysqlTable("amount_distribution", {
  id: int("id").autoincrement().primaryKey(),
  round_id: varchar("round_id", { length: 36 })
    .notNull()
    .references(() => game_rounds.id, { onDelete: "CASCADE" }),
  user_id: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "CASCADE" }),
  roles: Roles.notNull(),
  bet_amount: decimal("bet_amount", { precision: 10, scale: 2 }).notNull(),
  share: decimal("share", { precision: 10, scale: 2 }).default(0.0).notNull(),
  commission: decimal("commission", { precision: 10, scale: 2 })
    .default(0.0)
    .notNull(),
  keep: decimal("keep", { precision: 10, scale: 2 }).default(0.0).notNull(),
  pass: decimal("pass", { precision: 10, scale: 2 }).default(0.0).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});
