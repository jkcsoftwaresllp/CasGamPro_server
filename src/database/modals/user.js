/**
 * Single Table for All User Roles → No need for separate superAgents, agents, players tables.
 * parentId Enables Hierarchical Access → Admin → Super-Agent → Agent → Player
 *
 * Hierarchy Example:
 * parent_id of a Super-Agent points to an Admin.
 * parent_id of an Agent points to a Super-Agent.
 * parent_id of a Player points to an Agent.
 *
 */

import { Roles } from "./doNotChangeOrder.helper.js";
import { mysqlTable, varchar, decimal, timestamp } from "drizzle-orm/mysql-core";
import { BlockingLevels } from "./doNotChangeOrder.helper.js";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  parent_id: varchar("parent_id", { length: 36 }).references(() => users.id, {
    onDelete: "SET NULL",
  }),
  first_name: varchar("first_name", { length: 255 }).notNull(),
  last_name: varchar("last_name", { length: 255 }),
  password: varchar("password", { length: 255 }).notNull(),
  role: Roles.notNull(), // SUPERADMIN, ADMIN, SUPERAGENT, AGENT, PLAYER
  blocking_levels: BlockingLevels.default("NONE").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default(0.0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});
