CREATE TABLE `team_account` (
	`id` integer PRIMARY KEY NOT NULL,
	`team_id` text(15) NOT NULL,
	`created_by` text(15) NOT NULL,
	`name` text(255) NOT NULL,
	`description` text(255),
	`created_at` text DEFAULT CURRENT_DATE NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `team_budget` (
	`team_id` text(15) NOT NULL,
	`category_id` integer NOT NULL,
	`date` text(7) NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`set_by` text(15) NOT NULL,
	PRIMARY KEY(`category_id`, `date`, `team_id`),
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `team_category`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`set_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `team_category` (
	`id` integer PRIMARY KEY NOT NULL,
	`team_id` text(15) NOT NULL,
	`created_by` text(15) NOT NULL,
	`name` text(255) NOT NULL,
	`description` text(255),
	`created_at` text DEFAULT CURRENT_DATE NOT NULL,
	`goal` integer,
	`retired` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Team_transaction` (
	`id` integer PRIMARY KEY NOT NULL,
	`team_id` text(15) NOT NULL,
	`category_id` integer,
	`account_id` integer NOT NULL,
	`created_by` text(15) NOT NULL,
	`description` text(255),
	`date` text(10) DEFAULT CURRENT_DATE NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP  NOT NULL,
	`flow` integer NOT NULL,
	`validated` integer NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `team_category`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `team_account`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
