import { mysqlTable, int, varchar, text } from "drizzle-orm/mysql-core";

import { Languages, Roles } from "./doNotChangeOrder.helper.js";

// Rules Table
export const rules = mysqlTable("rules", {
  id: int("id").autoincrement().primaryKey(),
  rule_code: varchar("rule_code", { length: 255 }).unique().notNull(),
  type: Roles.notNull(),
  language: Languages.notNull(),
  rule: text("rule").notNull(),
});
