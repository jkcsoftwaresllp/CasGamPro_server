import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config();

const runMigrations = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
            rejectUnauthorized: false
        }
    });

    const db = drizzle(connection);

    console.log('Running migrations...');
    await migrate(db, {migrationsFolder: "src/database/migrations"});
    console.log('Migrations completed!');

    console.log('Running seeds...');
    await import('./seed.js');
    console.log('Seeds completed!');

    await connection.end();
};

runMigrations().catch(console.error);
