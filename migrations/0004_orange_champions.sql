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
ALTER TABLE `transaction` DROP COLUMN `team_id`;