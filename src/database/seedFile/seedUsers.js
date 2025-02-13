import { db } from "../../config/db.js";
import { users } from "../schema.js";
import { eq } from "drizzle-orm";

export const seedUsers = async (logger) => {
  logger.info("Seeding users...");

  const userList = [
    {
      username: "client1",
      password: "pass1",
      firstName: "Ram",
      lastName: "Raj",
      blocked: false,
      role: "PLAYER",
    },
    {
      username: "client2",
      password: "pass2",
      firstName: "Rahul",
      lastName: "Paswan",
      blocked: false,
      role: "PLAYER",
    },
    {
      username: "client3",
      password: "pass3",
      firstName: "Ajay",
      lastName: "Shekh",
      blocked: false,
      role: "PLAYER",
    },
    {
      username: "client4",
      password: "pass4",
      firstName: "Kushal",
      lastName: "Kritagya",
      blocked: false,
      role: "PLAYER",
    },
    {
      username: "client5",
      password: "pass5",
      firstName: "Paul",
      lastName: "Deaayan",
      blocked: false,
      role: "PLAYER",
    },
    {
      username: "agent1",
      password: "test1",
      firstName: "Danishan",
      lastName: "Farookh",
      blocked: false,
      role: "AGENT",
    },
    {
      username: "agent2",
      password: "test2",
      firstName: "Kinjalk",
      lastName: "Tripathi",
      blocked: false,
      role: "AGENT",
    },
    {
      username: "agent3",
      password: "test3",
      firstName: "Abdullah",
      lastName: "M. Yasir",
      blocked: false,
      role: "AGENT",
    },
    {
      username: "agent4",
      password: "test",
      firstName: "Rishabh",
      lastName: "Mishra",
      blocked: false,
      role: "AGENT",
    },
    {
      username: "SUPERAGENT1",
      password: "sss",
      firstName: "Vivek",
      lastName: "Kumar",
      blocked: false,
      role: "SUPERAGENT",
    },
  ];

  for (const user of userList) {
    await db
      .insert(users)
      .values(user)
      .onDuplicateKeyUpdate({
        set: { firstName: user.firstName, lastName: user.lastName },
      });
  }

  logger.info("Users inserted successfully.");
};
