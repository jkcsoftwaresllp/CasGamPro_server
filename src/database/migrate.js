import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { config } from "dotenv";
import { logger } from "../logger/logger.js";
import { seed } from "./seed.js";

config();

const runMigrations = async () => {
  // First connect without specifying a database
  const initialConnection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Drop the database if it exists
    logger.info("Dropping existing database...");
    await initialConnection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
    logger.info("Database dropped successfully!");

    // Create the database
    logger.info("Creating new database...");
    await initialConnection.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    logger.info("Database created successfully!");

    // Close initial connection
    await initialConnection.end();

    // Create new connection with the database selected
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
    await seed();

    logger.info("All the things completed!");
    await connection.end();
    process.exit(0);
  } catch (error) {
    logger.error("Error during database setup:", error);
    throw error;
  }
};

runMigrations().catch(logger.error);
