import { transferBalance } from "../../database/queries/panels/transferBalance.js";
import { createResponse } from "../../helper/responseHelper.js";

export const walletTransaction = async (req, res) => {
  const { userId, type, amount } = req.body;
  const ownerId = req.session.userId;

  if (!userId || !type || !amount) {
    let temp = createResponse(
      "error",
      "CGP0057",
      "User ID, type, and amount are required"
    );
    return res.status(400).json(temp);
  }

  if (amount <= 0) {
    let temp2 = createResponse("error", "CGP0064", "Invalid amount");
    return res.status(400).json(temp2);
  }

  let transferResult;
  if (type === "deposit") {
    transferResult = await transferBalance({
      ownerId: ownerId, // From Whose Account, balance will be deducted
      userId: userId, // In Whose Account, balance will be credited
      balance: amount,
    });
  } else {
    transferResult = await transferBalance({
      ownerId: userId,
      userId: ownerId,
      balance: amount,
    });
  }

  if (transferResult.success) {
    const successResponse = createResponse(
      "success",
      "CGP0062",
      transferResult.msg,
      { ...transferResult.data }
    );
    return res.status(200).json(successResponse);
  } else {
    const errorResponse = createResponse(
      "error",
      "CGP0061",
      transferResult.msg,
      {}
    );
    return res.status(200).json(errorResponse);
  }
};
