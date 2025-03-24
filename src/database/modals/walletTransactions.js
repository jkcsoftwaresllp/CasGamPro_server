import {
  mysqlTable,
  varchar,
  timestamp,
  decimal,
} from "drizzle-orm/mysql-core";

import { Status, TransactionType } from "./doNotChangeOrder.helper.js";
import { users } from "./user.js";

// Do not change the Order of this

export const wallet_transactions = mysqlTable("wallet_transactions", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  user_id: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "CASCADE" }),
  transaction_type: TransactionType.notNull(), // DEPOSIT, WITHDRAWAL, TRANSFER, BONUS
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: Status.default("PENDING"),
  created_at: timestamp("created_at").defaultNow(),
});
