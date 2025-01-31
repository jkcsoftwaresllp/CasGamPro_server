CREATE TABLE `super_agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`min_bet` int NOT NULL,
	`max_bet` int NOT NULL,
	CONSTRAINT `super_agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `agents` ADD `super_agent_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `super_agents` ADD CONSTRAINT `super_agents_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agents` ADD CONSTRAINT `agents_super_agent_id_super_agents_id_fk` FOREIGN KEY (`super_agent_id`) REFERENCES `super_agents`(`id`) ON DELETE cascade ON UPDATE no action;