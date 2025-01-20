import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { config } from "dotenv";
import { logger } from "../logger/logger.js";

config();

const runMigrations = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const db = drizzle(connection);

  logger.info("Running migrations...");
  await migrate(db, { migrationsFolder: "src/database/migrations" });
  logger.info("Migrations completed!");

  logger.info("Running seeds...");
  await import("./seed.js");
  logger.info("Seeds completed!");

  await connection.end();
};

runMigrations().catch(logger.error);
