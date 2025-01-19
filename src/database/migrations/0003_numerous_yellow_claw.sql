ALTER TABLE `rules` DROP INDEX `rules_rule_unique`;--> statement-breakpoint
ALTER TABLE `rules` MODIFY COLUMN `rule` text NOT NULL;--> statement-breakpoint
ALTER TABLE `rules` ADD `ruleCode` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `rules` ADD `type` enum('CLIENT','AGENT','ADMIN') NOT NULL;--> statement-breakpoint
ALTER TABLE `rules` ADD `language` enum('ENG','HIN') NOT NULL;--> statement-breakpoint
ALTER TABLE `rules` ADD CONSTRAINT `rules_ruleCode_unique` UNIQUE(`ruleCode`);