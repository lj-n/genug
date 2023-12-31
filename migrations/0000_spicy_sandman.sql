CREATE TABLE `user_key` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`user_id` text(15) NOT NULL,
	`hashed_password` text(255),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_session` (
	`id` text(128) PRIMARY KEY NOT NULL,
	`user_id` text(15) NOT NULL,
	`active_expires` integer NOT NULL,
	`idle_expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `team` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`description` text(255),
	`created_at` text DEFAULT CURRENT_DATE NOT NULL
);
--> statement-breakpoint
CREATE TABLE `team_account` (
	`id` integer PRIMARY KEY NOT NULL,
	`team_id` integer NOT NULL,
	`created_by` text(15) NOT NULL,
	`name` text(255) NOT NULL,
	`description` text(255),
	`created_at` text DEFAULT CURRENT_DATE NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `team_budget` (
	`team_id` integer NOT NULL,
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
	`team_id` integer NOT NULL,
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
CREATE TABLE `team_user` (
	`user_id` text(15) NOT NULL,
	`team_id` integer NOT NULL,
	`role` text NOT NULL,
	PRIMARY KEY(`team_id`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `team_transaction` (
	`id` integer PRIMARY KEY NOT NULL,
	`team_id` integer NOT NULL,
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
--> statement-breakpoint
CREATE TABLE `token` (
	`id` text(63) PRIMARY KEY NOT NULL,
	`user_id` text(15) NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text(15) PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_account` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text(15) NOT NULL,
	`name` text(255) NOT NULL,
	`description` text(255),
	`created_at` text DEFAULT CURRENT_DATE NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_avatar` (
	`user_id` text(15) PRIMARY KEY NOT NULL,
	`image` blob,
	`image_type` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_budget` (
	`user_id` text(15) NOT NULL,
	`category_id` integer NOT NULL,
	`date` text(7) NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`category_id`, `date`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `user_category`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_category` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text(15) NOT NULL,
	`name` text(255) NOT NULL,
	`description` text(255),
	`created_at` text DEFAULT CURRENT_DATE NOT NULL,
	`goal` integer,
	`retired` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text(15) NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`category_order` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_transaction` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text(15) NOT NULL,
	`category_id` integer,
	`account_id` integer NOT NULL,
	`description` text(255),
	`date` text(10) DEFAULT CURRENT_DATE NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP  NOT NULL,
	`flow` integer NOT NULL,
	`validated` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `user_category`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `user_account`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_name_unique` ON `user` (`name`);