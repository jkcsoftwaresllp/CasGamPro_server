import { db } from "../../config/db.js";
import { players } from "../schema.js";
import { eq } from "drizzle-orm";

export const seedPlayers = async (logger) => {
  logger.info("Seeding players...");

  // Mapping players to userId (assuming IDs are assigned in order)
  const playerList = [
    {
      userId: 1,
      agentId: 1,
      balance: 0,
      share: 2,
      sessionCommission: 1.5,
      lotteryCommission: 1.5,
      casinoCommission: 2,
    },
  ];
  for (const player of playerList) {
    await db
      .insert(players)
      .values(player)
      .onDuplicateKeyUpdate({
        set: { balance: player.balance },
      });
  }

  logger.info("Players inserted successfully.");
};
