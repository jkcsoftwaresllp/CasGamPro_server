CREATE TABLE player_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playerId INT NOT NULL,
    totalBets INT DEFAULT 0,
    totalWins INT DEFAULT 0,
    totalLosses INT DEFAULT 0,
    totalBetAmount INT DEFAULT 0,
    totalWinnings DECIMAL(10,2) DEFAULT 0,
    winLossRatio DECIMAL(10,2) DEFAULT 0,
    gamesPlayed INT DEFAULT 0,
    lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE
);
