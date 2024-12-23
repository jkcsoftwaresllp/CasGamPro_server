import mysql from 'mysql2/promise'; // Use the promise wrapper
import { config } from 'dotenv';

config();
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

const pool = mysql.createPool({
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

export default pool;

