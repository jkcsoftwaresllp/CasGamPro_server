CREATE TABLE `ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` timestamp NOT NULL,
	`entry` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`debit` decimal(10,2) NOT NULL DEFAULT 0,
	`credit` decimal(10,2) NOT NULL DEFAULT 0,
	`balance` decimal(10,2) NOT NULL,
	`status` enum('WIN','LOSS','BET_PLACED') NOT NULL,
	`game_name` varchar(255) NOT NULL,
	`round_id` varchar(255) NOT NULL,
	`stake_amount` decimal(10,2) NOT NULL,
	`results` enum('WIN','TIE','LOSE') NOT NULL,
	CONSTRAINT `ledger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `ledger_entries`;--> statement-breakpoint
ALTER TABLE `player_stats` MODIFY COLUMN `totalBetAmount` decimal(10,2);--> statement-breakpoint
ALTER TABLE `player_stats` MODIFY COLUMN `totalWinnings` decimal(10,2) DEFAULT 0;--> statement-breakpoint
ALTER TABLE `players` MODIFY COLUMN `balance` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `players` MODIFY COLUMN `fixLimit` decimal(10,2);--> statement-breakpoint
ALTER TABLE `agents` ADD `commissionLimits` decimal(10,2) DEFAULT 0;--> statement-breakpoint
ALTER TABLE `agents` ADD `maximumShare` decimal(10,2) DEFAULT 0;--> statement-breakpoint
ALTER TABLE `agents` ADD `total_players` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `rounds` ADD `results` enum('WIN','TIE','LOSE') NOT NULL;--> statement-breakpoint
ALTER TABLE `rules` ADD `rule_types` enum('CLIENT','AGENT','ADMIN') NOT NULL;--> statement-breakpoint
ALTER TABLE `rules` ADD `languages` enum('ENG','HIN') NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `roles` enum('SUPERADMIN','ADMIN','AGENT','PLAYER') NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `blocking_levels` enum('LEVEL_1','LEVEL_2','LEVEL_3','NONE') DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE `ledger` ADD CONSTRAINT `ledger_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rounds` DROP COLUMN `result`;--> statement-breakpoint
ALTER TABLE `rules` DROP COLUMN `type`;--> statement-breakpoint
ALTER TABLE `rules` DROP COLUMN `language`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `roles`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `blocking_levels`;