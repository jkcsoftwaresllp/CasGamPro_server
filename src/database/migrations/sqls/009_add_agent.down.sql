DELETE FROM agents WHERE userId = (SELECT id FROM users WHERE userId = 'ROOT1');
