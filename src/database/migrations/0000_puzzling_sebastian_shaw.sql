CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`super_agent_id` int,
	`maximumShare` decimal(10,2) DEFAULT 0,
	`maxCasinoCommission` decimal(10,2) DEFAULT 0,
	`maxLotteryCommission` decimal(10,2) DEFAULT 0,
	`maxSessionCommission` decimal(10,2) DEFAULT 0,
	`fixLimit` decimal(10,2) DEFAULT 0,
	`balance` decimal(10,2) DEFAULT 0,
	`total_clients` int DEFAULT 0,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roundId` int,
	`gameId` varchar(255),
	`playerId` int NOT NULL,
	`betAmount` int NOT NULL,
	`betSide` varchar(255) NOT NULL,
	`win` boolean,
	CONSTRAINT `bets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`thumbnail` varchar(255),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `favorite_games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`totalPlayTime` varchar(50),
	`gameImg` varchar(255),
	CONSTRAINT `favorite_games_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorite_games_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`thumbnail` varchar(255),
	`category_id` int NOT NULL,
	CONSTRAINT `games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`message` text NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`totalBets` int DEFAULT 0,
	`totalWins` int DEFAULT 0,
	`totalBetAmount` decimal(10,2) DEFAULT 0,
	`totalWinnings` decimal(10,2) DEFAULT 0,
	`gamesPlayed` int DEFAULT 0,
	`lastUpdated` timestamp DEFAULT (now()),
	CONSTRAINT `player_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int NOT NULL,
	`balance` decimal(10,2) NOT NULL,
	`fixLimit` decimal(10,2),
	`matchShare` decimal(10,2),
	`lotteryCommission` decimal(10,2),
	`sessionCommission` decimal(10,2),
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`game` varchar(255) NOT NULL,
	`cards` json NOT NULL,
	`blindCard` varchar(255) NOT NULL,
	`results` enum('WIN','TIE','LOSE') NOT NULL,
	CONSTRAINT `rounds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleCode` varchar(255) NOT NULL,
	`rule_types` enum('CLIENT','AGENT','ADMIN') NOT NULL,
	`language` enum('ENG','HIN') NOT NULL,
	`rule` text NOT NULL,
	CONSTRAINT `rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `rules_ruleCode_unique` UNIQUE(`ruleCode`)
);
--> statement-breakpoint
CREATE TABLE `super_agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`min_bet` int NOT NULL DEFAULT 0,
	`max_bet` int NOT NULL DEFAULT 0,
	CONSTRAINT `super_agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(255) NOT NULL,
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255),
	`password` varchar(255) NOT NULL,
	`blocked` boolean,
	`role` enum('SUPERADMIN','ADMIN','SUPERAGENT','AGENT','PLAYER') NOT NULL,
	`blocking_levels` enum('LEVEL_1','LEVEL_2','LEVEL_3','NONE') NOT NULL DEFAULT 'NONE',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `agents` ADD CONSTRAINT `agents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agents` ADD CONSTRAINT `agents_super_agent_id_super_agents_id_fk` FOREIGN KEY (`super_agent_id`) REFERENCES `super_agents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bets` ADD CONSTRAINT `bets_roundId_rounds_id_fk` FOREIGN KEY (`roundId`) REFERENCES `rounds`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bets` ADD CONSTRAINT `bets_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorite_games` ADD CONSTRAINT `favorite_games_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `games` ADD CONSTRAINT `games_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ledger` ADD CONSTRAINT `ledger_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_stats` ADD CONSTRAINT `player_stats_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `players` ADD CONSTRAINT `players_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `players` ADD CONSTRAINT `players_agentId_agents_id_fk` FOREIGN KEY (`agentId`) REFERENCES `agents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `super_agents` ADD CONSTRAINT `super_agents_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;