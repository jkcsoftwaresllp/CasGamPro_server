CREATE TABLE players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    agentId INT NOT NULL,
    balance INT NOT NULL,
    fixLimit INT,
    matchShare DECIMAL(10,2),
    lotteryCommission DECIMAL(10,2),
    sessionCommission DECIMAL(10,2),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (agentId) REFERENCES agents(id) ON DELETE CASCADE
);
