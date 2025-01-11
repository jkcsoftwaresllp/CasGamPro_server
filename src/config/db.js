import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise'; // Use the promise wrapper
import { config } from 'dotenv';

config();
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

export const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test the connection
pool.getConnection()
    .then(connection => {
        console.log('Connected to database!');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed: ', err);
    });

export const db = drizzle(pool);