ALTER TABLE `users` MODIFY COLUMN `role` enum('SUPERADMIN','ADMIN','SUPERAGENT','AGENT','PLAYER') NOT NULL;