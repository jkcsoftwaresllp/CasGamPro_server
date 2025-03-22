import { db } from "../../config/db.js";
import { users } from "../modals/user.js";
import { ROLES } from "../../database/modals/doNotChangeOrder.helper.js";
import { BlockingLevels } from "../modals/doNotChangeOrder.helper.js";
import { logger } from "../../logger/logger.js";

// Function to generate a simple password based on the user's name
const generatePassword = (name) => `${name.toLowerCase()}@123`; // Example: "john@123"
const generateUserId = (name) => `${name.toUpperCase()}123`; // Example: "john@123"

export const adminId = generateUserId("Admin"); // NOTE: we are using adminId in files
// Seed function
export const seedUsers = async () => {
  logger.info("Seeding users data...");

  try {
    // Insert SUPERADMIN & ADMIN first (no parent)

    await db.insert(users).values([
      {
        id: adminId,
        parent_id: null,
        first_name: "Admin",
        last_name: "User",
        password: generatePassword("Admin"),
        role: ROLES[0],
        blocking_levels: BlockingLevels.NONE,
        balance: 99999999.99,
      },
    ]);

    return;

    // Insert SUPERAGENT under ADMIN
    const superAgentId = generateUserId("Vivek");
    await db.insert(users).values([
      {
        id: superAgentId,
        parent_id: adminId,
        first_name: "Vivek",
        last_name: "Kumar",
        password: generatePassword("Vivek"),
        role: ROLES[1],
        blocking_levels: BlockingLevels.NONE,
        balance: 100000,
      },
    ]);

    // Insert AGENTS under SUPERAGENT
    const agent1Id = generateUserId("Danishan");
    const agent2Id = generateUserId("Yasir");

    await db.insert(users).values([
      {
        id: agent1Id,
        parent_id: superAgentId,
        first_name: "Danishan",
        last_name: "Farookh",
        password: generatePassword("Danishan"),
        role: ROLES[2],
        blocking_levels: BlockingLevels.NONE,
        balance: 100000,
      },
      {
        id: agent2Id,
        parent_id: superAgentId,
        first_name: "Abdullah",
        last_name: "M. Yasir",
        password: generatePassword("Abdullah"),
        role: ROLES[2],
        blocking_levels: BlockingLevels.NONE,
        balance: 100000,
      },
    ]);

    // Insert PLAYERS under AGENTS
    const player1Id = generateUserId("Max");
    const player2Id = generateUserId("Rishabh");

    await db.insert(users).values([
      {
        id: player1Id,
        parent_id: agent1Id,
        first_name: "Max",
        last_name: "Newman",
        password: generatePassword("Max"),
        role: ROLES[3],
        blocking_levels: BlockingLevels.NONE,
        balance: 1000,
      },
      {
        id: player2Id,
        parent_id: agent2Id,
        first_name: "Rishabh",
        last_name: "Mishra",
        password: generatePassword("Rishabh"),
        role: ROLES[3],
        blocking_levels: BlockingLevels.NONE,
        balance: 10000,
      },
    ]);

    logger.info("Users table seeded successfully.");
  } catch (error) {
    logger.error("Error seeding users table:", error);
  }
};
