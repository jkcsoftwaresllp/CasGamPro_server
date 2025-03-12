import {
  mysqlTable,
  varchar,
  timestamp,
  decimal,
} from "drizzle-orm/mysql-core";

import { Status } from "./doNotChangeOrder.helper.js";
import { users } from "./user.js";

export const referrals = mysqlTable("referrals", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  referrer_id: varchar("referrer_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "CASCADE" }),
  referred_user_id: varchar("referred_user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "CASCADE" }),
  reward_amount: decimal("reward_amount", { precision: 10, scale: 2 }).default(
    0.0
  ),
  status: Status.default("PENDING"),
  created_at: timestamp("created_at").defaultNow(),
});
