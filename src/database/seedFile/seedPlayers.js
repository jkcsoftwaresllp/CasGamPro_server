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
      balance: 10000,
      fixLimit: 10,
      share: 2,
      sessionCommission: 1.5,
      lotteryCommission: 1.5,
      casinoCommission: 2,
    },
    {
      userId: 2,
      agentId: 2,
      balance: 10000,
      fixLimit: 15,
      share: 2.5,
      sessionCommission: 1.2,
      lotteryCommission: 1.2,
      casinoCommission: 3,
    },
    {
      userId: 3,
      agentId: 3,
      balance: 10000,
      fixLimit: 5,
      share: 1.8,
      sessionCommission: 1.0,
      lotteryCommission: 1.0,
      casinoCommission: 1,
    },
    {
      userId: 4,
      agentId: 4,
      balance: 10000,
      fixLimit: 20,
      share: 3,
      sessionCommission: 1.7,
      lotteryCommission: 1.7,
      casinoCommission: 2,
    },
    {
      userId: 5,
      agentId: 4,
      balance: 10000,
      fixLimit: 25,
      share: 2,
      sessionCommission: 1.9,
      lotteryCommission: 1.9,
      casinoCommission: 3,
    },
  ];

  for (const player of playerList) {
    await db
      .insert(players)
      .values(player)
      .onDuplicateKeyUpdate({
        set: { balance: player.balance, fixLimit: player.fixLimit },
      });
  }

  logger.info("Players inserted successfully.");
};
