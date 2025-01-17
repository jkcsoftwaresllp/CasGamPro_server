import { db } from "../config/db.js";
import { users, agents, rules } from "./schema.js";
import { eq } from "drizzle-orm";
import rulesData from "../data/rulesData.js"; // Importing rules data

const seed = async () => {
  try {
    console.log("Seeding database...");

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
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, "ROOT1"));

    // Insert into agents table
    await db
      .insert(agents)
      .values({
        userId: user.id,
      })
      .onDuplicateKeyUpdate({
        set: {
          userId: user.id,
        },
      });

    console.log("Root agent user seeding completed!");

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

    console.log("Rules seeding completed!");

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

seed();
