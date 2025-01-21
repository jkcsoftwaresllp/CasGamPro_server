CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`thumbnail` varchar(255),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `games` DROP INDEX `games_name_unique`;--> statement-breakpoint
ALTER TABLE `games` MODIFY COLUMN `thumbnail` varchar(255);--> statement-breakpoint
ALTER TABLE `games` MODIFY COLUMN `description` text;--> statement-breakpoint
ALTER TABLE `games` ADD `category_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD CONSTRAINT `games_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `games` DROP COLUMN `rules`;--> statement-breakpoint
ALTER TABLE `games` DROP COLUMN `category`;--> statement-breakpoint
ALTER TABLE `games` DROP COLUMN `created_at`;