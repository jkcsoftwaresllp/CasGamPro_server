import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  decimal,
  text,
} from "drizzle-orm/mysql-core";

import { Results, Status, TransactionType } from "./doNotChangeOrder.helper.js";
import { users } from "./user.js";

export const ledger = mysqlTable("ledger", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), // For any user (Admin, Agent, Player)
  relatedUserId: int("relatedUserId").references(() => users.id, {
    onDelete: "cascade",
  }), // Agent-Player relationship, etc.
  roundId: varchar("roundId", { length: 255 }), // Nullable for non-game transactions
  transactionType: TransactionType.notNull(), // Covers all cases
  entry: varchar("entry", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  debit: decimal("debit", { precision: 10, scale: 2 }).default(0).notNull(),
  credit: decimal("credit", { precision: 10, scale: 2 }).default(0).notNull(),
  previousBalance: decimal("previous_balance", {
    precision: 10,
    scale: 2,
  }).notNull(),
  newBalance: decimal("new_balance", { precision: 10, scale: 2 }).notNull(),
  stakeAmount: decimal("stakeAmount", { precision: 10, scale: 2 }), // Nullable if not a bet
  result: Results, // Nullable if not a bet
  status: Status.notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
