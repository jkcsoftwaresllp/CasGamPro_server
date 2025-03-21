/** @type { import("drizzle-kit").Config } */
export default {
    schema: './src/database/schema.js',
   	out: './src/database/migrations/',
    dialect: 'mysql',
    dbCredentials: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    }
};
