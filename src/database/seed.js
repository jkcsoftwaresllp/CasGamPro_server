import { db } from "../config/db.js";
import { users, agents, rules, players, games, categories, superAgents, } from "./schema.js";
import { eq } from "drizzle-orm";
import { rulesData } from "../data/rulesData.js";
import { logger } from "../logger/logger.js";
import { gamesListData } from "../data/gamesListData.js";
import { gamesDataByCategory } from "../data/gamesDataByCategory.js";

const seed = async () => {
  try {
    logger.info("Seeding database...");

    // Insert super agent user
    const [superAgentUser] = await db
      .insert(users)
      .values({
        username: "SUPERAGENT1",
        firstName: "Super",
        lastName: "Agent",
        password: "sss",
        blocked: false,
        role: "SUPERAGENT",
      })
      .onDuplicateKeyUpdate({
        set: {
          firstName: "Super",
          lastName: "Agent",
        },
      });
    // Get the super agent user ID
    let [superAgent] = await db
      .select()
      .from(users)
      .where(eq(users.username, "SUPERAGENT1"));

    // Insert into super_agents table and link to super agent user
    const [superAgentRecord] = await db
      .insert(superAgents)
      .values({
        userId: superAgent.id,
        minBet: 10,
        maxBet: 1000,
      })
      .onDuplicateKeyUpdate({
        set: {
          userId: superAgent.id,
          minBet: 10,
          maxBet: 1000,
        },
      });

    logger.info("Super agent inserted successfully.");
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
        superAgentId: 1,
      })
      .onDuplicateKeyUpdate({
        set: {
          userId: user.id,
          superAgentId: 1,
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
        balance: 10000,
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
