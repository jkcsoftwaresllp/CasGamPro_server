CREATE TABLE
    IF NOT EXISTS StakeDetails (
        id INT AUTO_INCREMENT PRIMARY KEY,
        spectators VARCHAR(255),
        player VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );