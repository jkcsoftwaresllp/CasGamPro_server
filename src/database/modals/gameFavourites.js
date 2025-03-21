import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";
import { games } from "./games.js";
import { users } from "./user.js";

// Favorite Games table (linked to users)
export const game_favourites = mysqlTable("game_favourites", {
  id: int("id").autoincrement().primaryKey(),
  user_id: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  game_id: varchar("game_id", { length: 36 })
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
});
