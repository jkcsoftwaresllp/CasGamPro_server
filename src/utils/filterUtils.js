import { sql, eq, gte, lte, and } from "drizzle-orm";
import { players, users, ledger, agents } from "../database/schema.js";

export const filterUtils = (queryParams) => {
  const { startDate, endDate, userId, clientName, agentId } = queryParams;
  let conditions = [];
  if (userId) conditions.push(eq(players.userId, userId));
  if (clientName) conditions.push(eq(users.username, clientName));
  if (agentId) conditions.push(eq(agents.id, agentId));

  const formatDateForMySQL = (dateStr, time = "00:00:00") => {
    if (!dateStr) return null;

    const [day, month, year] = dateStr.split("-"); // Fix: Reverse format
    return `${year}-${month}-${day} ${time}`;
  };

  // Collect valid date columns based on joined tables
  let dateColumns = [users.created_at]; 

  if (queryParams.includePlayers) dateColumns.push(players.created_at);
  if (queryParams.includeAgents) dateColumns.push(agents.created_at);
  if (queryParams.includeLedger) dateColumns.push(ledger.created_at);

  if (startDate) {
    const formattedStart = formatDateForMySQL(startDate);
    conditions.push(gte(dateColumns, sql`CAST(${formattedStart} AS DATETIME)`));
  }

  if (endDate) {
    const formattedEnd = formatDateForMySQL(endDate, "23:59:59");
    conditions.push(lte(dateColumns, sql`CAST(${formattedEnd} AS DATETIME)`));
  }
  // console.log("Generated Conditions:", conditions);
  return conditions;
};
