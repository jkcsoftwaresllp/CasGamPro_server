import { db } from "../config/db.js";
import { users, agents, rules, players, games } from "./schema.js";
import { eq } from "drizzle-orm";
import { rulesData } from "../data/rulesData.js";
import { logger } from "../logger/logger.js";
import { gamesListData } from "../data/gamesListData.js";

const seed = async () => {
  try {
    logger.info("Seeding database...");

    // Insert root agent user
    const [rootUser] = await db
      .insert(users)
      .values({
        username: "ROOT1",
        firstName: "Root",
        lastName: "Agent",
        password: "test",
        blocked: false,
        role: "AGENT",
      })
      .onDuplicateKeyUpdate({
        set: {
          firstName: "Root",
          lastName: "Agent",
        },
      });

    // Get the user to get their ID
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, "ROOT1"));

    // Insert into agents table
    const [agent] = await db
      .insert(agents)
      .values({
        userId: user.id,
      })
      .onDuplicateKeyUpdate({
        set: {
          userId: user.id,
        },
      });

    const [playerUser] = await db
      .insert(users)
      .values({
        username: "client",
        password: "nnn",
        firstName: "pp",
        lastName: "p",
        blocked: false,
        role: "PLAYER",
      })
      .onDuplicateKeyUpdate({
        set: {
          firstName: "pp",
          lastName: "p",
        },
      });

    let [player] = await db
      .select()
      .from(users)
      .where(eq(users.username, "client"));

    await db
      .insert(players)
      .values({
        userId: player.id,
        agentId: 1,
        balance: 1000,
        fixLimit: 10,
        matchShare: 2,
        sessionCommission: 1.5,
        lotteryCommission: 1.5,
      })
      .onDuplicateKeyUpdate({
        set: {
          balance: 0,
          fixLimit: 10,
          matchShare: 2,
          sessionCommission: 1.5,
          lotteryCommission: 1.5,
        },
      });

    // Insert predefined games inside the try block
    await db.insert(games).values(gamesListData);

    // Insert rules from the rulesData file
    for (const rule of rulesData) {
      await db
        .insert(rules)
        .values(rule)
        .onDuplicateKeyUpdate({
          set: {
            type: rule.type,
            rule: rule.rule,
          },
        });
    }

    logger.info("Rules seeding completed!");
    logger.info("Seeding completed successfully!");
    logger.info("Press Ctrl+C to exit...");
  } catch (error) {
    logger.error("Error seeding database:", error); // Changed to logger.error()
  }
};

seed();
