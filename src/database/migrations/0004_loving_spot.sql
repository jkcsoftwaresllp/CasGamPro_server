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
	`thumbnail` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`rules` text NOT NULL,
	`category` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `games_id` PRIMARY KEY(`id`),
	CONSTRAINT `games_name_unique` UNIQUE(`name`)
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
ALTER TABLE `favorite_games` ADD CONSTRAINT `favorite_games_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;