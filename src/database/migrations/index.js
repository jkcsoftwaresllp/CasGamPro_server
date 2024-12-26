// src/database/migrations/index.js
import fs from 'fs/promises';
import path from 'path';
import pool from '../../config/db.js';

async function createMigrationsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            status ENUM('up', 'down') DEFAULT 'up',
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

async function getExecutedMigrations() {
    const [rows] = await pool.query('SELECT name FROM migrations WHERE status = "up"');
    return rows.map(row => row.name);
}

async function runMigration(direction = 'up') {
    try {
        await createMigrationsTable();
        
        let sqlFiles = await fs.readdir(path.join(process.cwd(), 'src', 'database', 'migrations', 'sqls'));
        
        // Filter for up/down files
        sqlFiles = sqlFiles.filter(f => f.endsWith(`${direction}.sql`));
        
        if (direction === 'down') {
            sqlFiles = sqlFiles.reverse(); // Run rollbacks in reverse order
        }

        const executedMigrations = await getExecutedMigrations();
        
        for (const file of sqlFiles) {
            const baseName = file.replace(`.${direction}.sql`, '');
            
            if (direction === 'up' && executedMigrations.includes(baseName)) {
                console.log(`Skipping ${file} - already executed`);
                continue;
            }

            if (direction === 'down' && !executedMigrations.includes(baseName)) {
                console.log(`Skipping ${file} - not previously executed`);
                continue;
            }

            const sql = await fs.readFile(
                path.join(process.cwd(), 'src', 'database', 'migrations', 'sqls', file),
                'utf8'
            );

            await pool.query(sql);
            
            if (direction === 'up') {
                await pool.query('INSERT INTO migrations (name, status) VALUES (?, ?)', [baseName, 'up']);
            } else {
                await pool.query('UPDATE migrations SET status = ? WHERE name = ?', ['down', baseName]);
            }
            
            console.log(`${direction === 'up' ? 'Executed' : 'Rolled back'} ${file}`);
        }

        console.log(`${direction === 'up' ? 'Migration' : 'Rollback'} completed`);
        process.exit(0);
    } catch (error) {
        console.error(`${direction === 'up' ? 'Migration' : 'Rollback'} failed:`, error);
        process.exit(1);
    }
}

const direction = process.argv[2] === 'down' ? 'down' : 'up';
runMigration(direction);