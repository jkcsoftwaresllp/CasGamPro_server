export const filterUtils = ({
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
