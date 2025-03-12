import { mysqlTable, varchar, timestamp, text } from "drizzle-orm/mysql-core";

export const system_settings = mysqlTable("system_settings", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  setting_name: varchar("setting_name", { length: 255 }).unique().notNull(),
  setting_value: text("setting_value").notNull(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});
