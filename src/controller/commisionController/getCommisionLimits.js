import { getChilds } from "../clients/getClients.js";

export const getCommisionLimits = async (req, res) => {
  return await getChilds(req, res);
};
