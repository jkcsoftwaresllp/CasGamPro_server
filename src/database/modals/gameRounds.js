import { mysqlTable, varchar, timestamp, json } from "drizzle-orm/mysql-core";
import { games } from "./games.js";

export const game_rounds = mysqlTable("game_rounds", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  game_id: varchar("game_id", { length: 36 })
    .notNull()
    .references(() => games.id, { onDelete: "CASCADE" }),
  playerA: json("playerA"),
  playerB: json("playerB"),
  playerC: json("playerC"),
  playerD: json("playerD"),
  winner: json("winner"),
  joker_card: varchar("joker_card", { length: 3 }),
  blind_card: varchar("blind_card", { length: 3 }),
  created_at: timestamp("created_at").defaultNow(),
});
