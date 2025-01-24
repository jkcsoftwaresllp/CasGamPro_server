CREATE TABLE `ledger_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`date` timestamp NOT NULL,
	`entry` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`debit` decimal(10,2) DEFAULT 0,
	`credit` decimal(10,2) DEFAULT 0,
	`balance` decimal(10,2) NOT NULL DEFAULT 0,
	`status` enum('WIN','LOSS','PENDING') NOT NULL,
	CONSTRAINT `ledger_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ledger_entries` ADD CONSTRAINT `ledger_entries_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;