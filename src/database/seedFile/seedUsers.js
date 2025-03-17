import { db } from "../../config/db.js";
import { users } from "../modals/user.js";
import { ROLES } from "../../database/modals/doNotChangeOrder.helper.js";
import { BlockingLevels } from "../modals/doNotChangeOrder.helper.js";
import { generateUserId } from "../../utils/generateUserId.js";
import { logger } from "../../logger/logger.js";

// Function to generate a simple password based on the user's name
const generatePassword = (name) => `${name.toLowerCase()}@123`; // Example: "john@123"

// Seed function
export const seedUsers = async () => {
  try {
    // Insert SUPERADMIN & ADMIN first (no parent)
    const adminId = generateUserId("Admin");

    await db.insert(users).values([
      {
        id: adminId,
        parent_id: null,
        first_name: "Admin",
        last_name: "User",
        password: generatePassword("Admin"),
        role: ROLES[0],
        blocking_levels: BlockingLevels.NONE,
        balance: 100000,
      },
    ]);

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
    const player1Id = generateUserId("Kinjalk");
    const player2Id = generateUserId("Rishabh");

    await db.insert(users).values([
      {
        id: player1Id,
        parent_id: agent1Id,
        first_name: "Kinjalk",
        last_name: "Tripathi",
        password: generatePassword("Kinjalk"),
        role: ROLES[3],
        blocking_levels: BlockingLevels.NONE,
        balance: 0,
      },
      {
        id: player2Id,
        parent_id: agent2Id,
        first_name: "Rishabh",
        last_name: "Mishra",
        password: generatePassword("Rishabh"),
        role: ROLES[3],
        blocking_levels: BlockingLevels.NONE,
        balance: 0,
      },
    ]);

    logger.log("Users table seeded successfully.");
  } catch (error) {
    logger.error("Error seeding users table:", error);
  }
};
