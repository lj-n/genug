DROP TABLE `team_budget`;--> statement-breakpoint
DROP TABLE `team_category`;--> statement-breakpoint
DROP TABLE `team_transaction`;--> statement-breakpoint
DROP TABLE `team_account`;--> statement-breakpoint
DROP TABLE `token`;--> statement-breakpoint
ALTER TABLE `user_account` RENAME TO `account`;--> statement-breakpoint
ALTER TABLE `user_budget` RENAME TO `budget`;--> statement-breakpoint
ALTER TABLE `user_category` RENAME TO `category`;--> statement-breakpoint
ALTER TABLE `user_transaction` RENAME TO `transaction`;--> statement-breakpoint
ALTER TABLE `budget` RENAME TO `old_budget`;--> statement-breakpoint
CREATE TABLE `budget` (
	`user_id` text(15) NOT NULL,
	`category_id` integer NOT NULL,
	`date` text(7) NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`category_id`, `date`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `budget` SELECT * FROM `old_budget`;--> statement-breakpoint
DROP TABLE `old_budget`;--> statement-breakpoint
ALTER TABLE user ADD `is_admin` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE account ADD `team_id` integer REFERENCES team(id);--> statement-breakpoint
ALTER TABLE category ADD `team_id` integer REFERENCES team(id);--> statement-breakpoint
ALTER TABLE `user_settings` RENAME TO `old_user_settings`;--> statement-breakpoint
CREATE TABLE `user_settings` (
	`user_id` text(15) PRIMARY KEY NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`category_order` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `user_settings` (`user_id`, `theme`, `category_order`) SELECT `user_id`, `theme`, `category_order` FROM `old_user_settings`;--> statement-breakpoint
DROP TABLE `old_user_settings`;
