import { sql, eq, gte, lte } from "drizzle-orm";
import { users, ledger, game_rounds } from "../database/schema.js";

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
  if (queryParams.includePlayers) dateConditions.push(users.created_at);
  if (queryParams.includeAgents) dateConditions.push(users.created_at);
  if (queryParams.includeLedger) dateConditions.push(ledger.createdAt);
  if (queryParams.includeRounds) dateConditions.push(game_rounds.created_at);
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
export const filterDateUtils = ({
  data = [],
  startDate,
  endDate,
  userId,
  clientName,
  agentId,
}) => {
  return data.filter((item) => {
    if (!item) return false; // Ignore invalid items

    let isValid = true;

    // Use "date" instead of "createdAt"
    const itemDate = item.date ? new Date(item.date) : null;
    const startTimestamp = startDate
      ? new Date(startDate + "T00:00:00Z")
      : null;
    const endTimestamp = endDate ? new Date(endDate + "T23:59:59Z") : null;

    if (startTimestamp && itemDate) {
      isValid = isValid && itemDate >= startTimestamp;
    }

    if (endTimestamp && itemDate) {
      isValid = isValid && itemDate <= endTimestamp;
    }

    if (userId !== undefined && item.userId !== undefined) {
      isValid = isValid && String(item.userId) === String(userId);
    }

    if (clientName && item.clientName) {
      isValid =
        isValid &&
        item.clientName
          .trim()
          .toLowerCase()
          .includes(clientName.trim().toLowerCase());
    }

    if (agentId !== undefined && item.agentId !== undefined) {
      isValid = isValid && String(item.agentId) === String(agentId);
    }

    return isValid;
  });
};
