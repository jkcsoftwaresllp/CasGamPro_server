import { sql, eq, gte, lte } from "drizzle-orm";
import { players, users, ledger, agents, rounds } from "../database/schema.js";

export const filterUtils = (queryParams) => {
  const { startDate, endDate, userId, clientName, agentId } = queryParams;
  let conditions = [];

  if (userId) conditions.push(eq(players.userId, userId));
  if (clientName) conditions.push(eq(users.username, clientName));
  if (agentId) conditions.push(eq(players.userId, agentId));

  const formatDateForMySQL = (dateStr, time = "00:00:00") => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day} ${time}`; // MySQL expects YYYY-MM-DD
  };

  let dateConditions = [];
  if (queryParams.includePlayers) dateConditions.push(players.createdAt);
  if (queryParams.includeAgents) dateConditions.push(agents.createdAt);
  if (queryParams.includeLedger) dateConditions.push(ledger.createdAt);
  if (queryParams.includeRounds) dateConditions.push(rounds.createdAt);
  else dateConditions.push(users.createdAt); // Default column

  if (startDate) {
    const formattedStart = formatDateForMySQL(startDate);
    dateConditions.forEach((col) =>
      conditions.push(
        gte(col, sql.raw(`CAST('${formattedStart}' AS DATETIME)`))
      )
    );
  }

  if (endDate) {
    const formattedEnd = formatDateForMySQL(endDate, "23:59:59");
    dateConditions.forEach((col) =>
      conditions.push(lte(col, sql.raw(`CAST('${formattedEnd}' AS DATETIME)`)))
    );
  }

  return conditions;
};
