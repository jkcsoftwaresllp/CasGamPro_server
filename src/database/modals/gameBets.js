import {
  mysqlTable,
  varchar,
  timestamp,
  decimal,
  int,
} from "drizzle-orm/mysql-core";

import { game_rounds } from "./gameRounds.js";
import { users } from "./user.js";

export const game_bets = mysqlTable("game_bets", {
  id: int("id").autoincrement().primaryKey(),
  user_id: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "CASCADE" }),
  round_id: varchar("round_id", { length: 36 })
    .notNull()
    .references(() => game_rounds.id, { onDelete: "CASCADE" }),
  bet_amount: decimal("bet_amount", { precision: 10, scale: 2 }).notNull(),
  bet_side: varchar("bet_side", { length: 255 }).notNull(),
  win_amount: decimal("win_amount", { precision: 10, scale: 2 }),
  created_at: timestamp("created_at").defaultNow(),
});
