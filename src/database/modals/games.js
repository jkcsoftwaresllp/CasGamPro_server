import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  text,
} from "drizzle-orm/mysql-core";

import { game_categories } from "./gameCategories.js";
import { GamesBlockingLevels } from "./doNotChangeOrder.helper.js";

export const games = mysqlTable("games", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  category_id: varchar("category_id", { length: 36 })
    .notNull()
    .references(() => game_categories.id, { onDelete: "CASCADE" }),
  gameType: varchar("gameType", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  thumbnail: varchar("thumbnail", { length: 255 }),
  blocked: GamesBlockingLevels.default("ACTIVE").notNull(),

  blocked_by: varchar("blocked_by", { length: 255 }),
  betting_duration: int("betting_duration").notNull().default(20000),
  card_deal_interval: int("card_deal_interval").notNull().default(3000),
  created_at: timestamp("created_at").defaultNow(),
});
