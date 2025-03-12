import {
  mysqlTable,
  varchar,
  boolean,
  timestamp,
  text,
} from "drizzle-orm/mysql-core";

export const game_categories = mysqlTable("game_categories", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  thumbnail: varchar("thumbnail", { length: 255 }),
  blocked: boolean("blocked").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});
