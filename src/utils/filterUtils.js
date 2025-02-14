import { sql, eq, gte, lte } from "drizzle-orm";
import { players, users, ledger } from "../database/schema.js";

export const filterUtils = (queryParams) => {
  const { startDate, endDate, userId, clientName, agentId } = queryParams;
  let conditions = [];

  if (userId) conditions.push(eq(players.userId, userId));
  if (clientName) conditions.push(eq(users.username, clientName));
  if (agentId) conditions.push(eq(players.agentId, agentId));

  const formatDateForMySQL = (dateStr) => {
    const [year, month, day] = dateStr.split("-");
    return `${year}-${month}-${day} 00:00:00`;
  };

  if (startDate) {
    conditions.push(
      gte(
        users.created_at,
        sql`CAST(${formatDateForMySQL(startDate)} AS DATETIME)`
      )
    );
  }

  if (endDate) {
    conditions.push(
      lte(
        users.created_at,
        sql`CAST(${formatDateForMySQL(endDate).replace(
          "00:00:00",
          "23:59:59"
        )} AS DATETIME)`
      )
    );
  }

  return conditions;
};
