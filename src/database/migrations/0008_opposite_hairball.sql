ALTER TABLE `ledger_entries` ADD `gameName` varchar(255);--> statement-breakpoint
ALTER TABLE `ledger_entries` ADD `roundId` varchar(255);--> statement-breakpoint
ALTER TABLE `ledger_entries` ADD `stakeAmount` decimal(10,2);--> statement-breakpoint
ALTER TABLE `ledger_entries` ADD `timestamp` timestamp DEFAULT (now());