import { mysqlTable, varchar, decimal, int } from "drizzle-orm/mysql-core";
import { games } from "./games.js";

export const game_bet_sides = mysqlTable("game_bet_sides", {
  id: int("id").autoincrement().primaryKey(),
  game_id: varchar("game_id", { length: 36 })
    .notNull()
    .references(() => games.id, { onDelete: "CASCADE" }),
  bet_side: varchar("bet_side", { length: 20 }).notNull(),
  multiplier: decimal("multiplier", { precision: 5, scale: 2 }).notNull(),
});
