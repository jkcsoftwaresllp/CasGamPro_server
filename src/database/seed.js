import { db } from "../config/db.js";
import { users, agents, rules, players, games, categories } from "./schema.js";
import { eq } from "drizzle-orm";
import { rulesData } from "../data/rulesData.js";
import { logger } from "../logger/logger.js";
import { gamesListData } from "../data/gamesListData.js";
import { gamesDataByCategory } from "../data/gamesDataByCategory.js";

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
        roles: "AGENT",
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
        roles: "PLAYER",
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

    //insertCategories
    await db.insert(categories).values(gamesListData);
    logger.info("Categories inserted successfully.");

    //insertGames
    await db.insert(games).values(gamesDataByCategory);
    logger.info("Games inserted successfully.");

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
