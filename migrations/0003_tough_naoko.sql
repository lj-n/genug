ALTER TABLE `user_account` RENAME TO `account`;--> statement-breakpoint
ALTER TABLE `user_budget` RENAME TO `budget`;--> statement-breakpoint
ALTER TABLE `user_category` RENAME TO `category`;--> statement-breakpoint
ALTER TABLE `user_transaction` RENAME TO `transaction`;--> statement-breakpoint
ALTER TABLE account ADD `team_id` integer REFERENCES team(id);--> statement-breakpoint
ALTER TABLE category ADD `team_id` integer REFERENCES team(id);--> statement-breakpoint
ALTER TABLE `transaction` ADD `team_id` integer REFERENCES team(id);