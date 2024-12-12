import pool from "../config/db.js";


const createTablesQuery = `
CREATE TABLE IF NOT EXISTS StakeDetails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    spectators VARCHAR(255),
    player VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS GameState (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id VARCHAR(255) UNIQUE NOT NULL,
    deck TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// Execute table creation
pool.query(createTablesQuery, (err, results) => {
  if (err) {
    console.error("Error creating tables:", err);
    return;
  }
  console.log("Tables created successfully:", results);
});
