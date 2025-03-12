import { mysqlTable, varchar, decimal } from "drizzle-orm/mysql-core";
import { games } from "./games.js";

export const game_bet_sides = mysqlTable("game_bet_sides", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  game_id: varchar("game_id", { length: 36 })
    .notNull()
    .references(() => games.id, { onDelete: "CASCADE" }),
  bet_side: varchar("bet_side", { length: 20 }).notNull(),
  multiplier: decimal("multiplier", { precision: 5, scale: 2 }).notNull(),
});
