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
  user_id: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  round_id: varchar("round_id", { length: 255 }), // Nullable for non-game transactions
  transaction_type: TransactionType.notNull(), // Covers all cases
  entry: varchar("entry", { length: 255 }).notNull(),
  debit: decimal("debit", { precision: 10, scale: 2 }).default(0).notNull(),
  credit: decimal("credit", { precision: 10, scale: 2 }).default(0).notNull(),
  stake_amount: decimal("stake_amount", { precision: 10, scale: 2 }), // Nullable if not a bet
  new_coins_balance: decimal("new_coins_balance", { precision: 10, scale: 2 }),
  new_exposure_balance: decimal("new_exposure_balance", {
    precision: 10,
    scale: 2,
  }),
  new_wallet_balance: decimal("new_wallet_balance", {
    precision: 10,
    scale: 2,
  }),

  results: Results, // Nullable if not a bet
  status: Status.notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});
