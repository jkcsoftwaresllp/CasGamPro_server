import { sql, eq, gte, lte, and } from "drizzle-orm";
import { players, users, ledger, agents } from "../database/schema.js";

export const filterUtils = (queryParams) => {
  const { startDate, endDate, userId, clientName, agentId } = queryParams;
  let conditions = [];

  if (userId) conditions.push(eq(players.userId, userId));
  if (clientName) conditions.push(eq(users.username, clientName));
  if (agentId) conditions.push(eq(agents.id, agentId));

  const formatDateForMySQL = (dateStr, time = "00:00:00") => {
    const [year, month, day] = dateStr.split("-");
    return `${year}-${month}-${day} ${time}`;
  };

  // Collect valid date columns based on joined tables
  let dateColumns = [users.created_at];

  if (queryParams.includePlayers) dateColumns.push(players.created_at);
  if (queryParams.includeAgents) dateColumns.push(agents.created_at);
  if (queryParams.includeLedger) dateColumns.push(ledger.created_at);

  if (startDate) {
    conditions.push(
      gte(
        sql`${
          dateColumns.length > 1
            ? sql`LEAST(${sql.join(dateColumns)})`
            : dateColumns[0]
        }`,
        sql`CAST(${formatDateForMySQL(startDate)} AS DATETIME)`
      )
    );
  }

  if (endDate) {
    conditions.push(
      lte(
        sql`${
          dateColumns.length > 1
            ? sql`GREATEST(${sql.join(dateColumns)})`
            : dateColumns[0]
        }`,
        sql`CAST(${formatDateForMySQL(endDate, "23:59:59")} AS DATETIME)`
      )
    );
  }

  return conditions;
};
