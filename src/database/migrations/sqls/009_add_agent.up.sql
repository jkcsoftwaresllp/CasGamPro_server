INSERT INTO agents (userId)
SELECT id FROM users WHERE userId = 'ROOT1';
