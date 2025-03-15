import { users } from "./user.js";
import { mysqlTable, int, decimal } from "drizzle-orm/mysql-core";

export const user_limits_commissions = mysqlTable("user_limits_commissions", {
  id: int("id").autoincrement().primaryKey(),
  user_id: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  min_bet: int("min_bet").default(0).notNull(),
  max_bet: int("max_bet").default(0).notNull(),
  max_share: decimal("max_share", { precision: 10, scale: 2 }).default(0.0),
  max_casino_commission: decimal("max_casino_commission", {
    precision: 10,
    scale: 2,
  }).default(0.0),
  max_lottery_commission: decimal("max_lottery_commission", {
    precision: 10,
    scale: 2,
  }).default(0.0),
  max_session_commission: decimal("max_session_commission", {
    precision: 10,
    scale: 2,
  }).default(0.0),
});
