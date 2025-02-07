export const formatDateForMySQL = (dateStr) => {
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day} 00:00:00`;
  };