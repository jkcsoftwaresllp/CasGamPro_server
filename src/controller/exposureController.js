import { db } from "../config/db.js";
import { game_bets, users, game_rounds } from "../database/schema.js";
import { eq, inArray, sql, desc } from "drizzle-orm";
import { logToFolderError } from "../utils/logToFolder.js";
import { getGameName } from "../utils/getGameName.js";

// Function to get all players who belong under an admin (including hierarchy)
const getAllPlayersUnderHierarchy = async (adminId) => {
  const allUsers = await db
    .select({ id: users.id, role: users.role, parentId: users.parent_id })
    .from(users);

  const playerIds = [];

  // Find all players that belong to this admin's hierarchy
  const findPlayers = (currentId) => {
    allUsers.forEach((user) => {
      if (user.parentId === currentId) {
        if (user.role === "PLAYER") {
          playerIds.push(user.id);
        }
        findPlayers(user.id); // Recursively find more players
      }
    });
  };

  findPlayers(adminId);
  return playerIds;
};

// Function to get all ancestors of a player
const getAllAncestors = async (playerId) => {
  const allUsers = await db
    .select({ id: users.id, role: users.role, parentId: users.parent_id })
    .from(users);

  const ancestors = new Set();

  const findAncestors = (currentId) => {
    const user = allUsers.find((u) => u.id === currentId);
    if (user && user.parentId) {
      ancestors.add(user.parentId);
      findAncestors(user.parentId); // Recursively find more ancestors
    }
  };

  findAncestors(playerId);
  return [...ancestors]; // Convert set to array
};

export const exposureController = async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(400).json({
        uniqueCode: "CGP0053",
        message: "User ID is required",
        data: {},
      });
    }

    await db.transaction(async (trx) => {
      // Step 1: Get all players under this admin's hierarchy
      const playerIds = await getAllPlayersUnderHierarchy(userId);

      if (playerIds.length === 0) {
        return res.json({
          uniqueCode: "CGP0058",
          message: "No players found under this user",
          data: {},
        });
      }

      // Step 2: Fetch all bets placed by these players
      const betsPlaced = await trx
        .select({
          betId: game_bets.id,
          roundId: game_bets.round_id,
          fancyName: game_bets.bet_side,
          betAmount: game_bets.bet_amount,
          winStatus: game_bets.win_amount,
          userId: game_bets.user_id,
        })
        .from(game_bets)
        .where(inArray(game_bets.user_id, playerIds))
        .where(sql`${game_bets.win_amount} IS NULL OR ${game_bets.win_amount} = FALSE`); //  Only unsettled bets

      if (!betsPlaced || betsPlaced.length === 0) {
        return res.json({
          uniqueCode: "CGP0058",
          message: "No bets found for the user",
          data: {},
        });
      }

      // Step 3: Check if the requesting user is an ancestor of these bet-placing players
      let validBets = [];
      for (const bet of betsPlaced) {
        const ancestors = await getAllAncestors(bet.userId);
        if (ancestors.includes(userId)) {
          validBets.push(bet);
        }
      }

      if (validBets.length === 0) {
        return res.json({
          uniqueCode: "CGP0058",
          message: "No bets found for the user",
          data: {},
        });
      }

      // Step 4: Process and return the bets
      const unsettledBets = await Promise.all(
        validBets.map(async (bet) => {
          const gameTypeId = bet.roundId.split("_")[0]; // Extract gameTypeId
          const gameName = await getGameName(gameTypeId);
          return {
            matchName: gameName,
            marketFancyName: `Pending bets for (${gameName})`,
            exposure: bet.betAmount,
          };
        })
      );

      if (unsettledBets.length > 0) {
        return res.json({
          uniqueCode: "CGP0059",
          message: "Unsettled bets found",
          data: { results: unsettledBets },
        });
      } else {
        return res.json({
          uniqueCode: "CGP0060",
          message: "All bets settled successfully",
          data: { results: [] },
        });
      }
    });
  } catch (error) {
    console.log(error);
    let tempError = {
      uniqueCode: "CGP0055",
      message: "Internal Server Error",
      data: { error: error.message },
    };

    logToFolderError("Exposure/controller", "exposureController", tempError);
    return res.status(500).json(tempError);
  }
};