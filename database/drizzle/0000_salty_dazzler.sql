CREATE TABLE `user_key` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`user_id` text(15) NOT NULL,
	`hashed_password` text(255),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_session` (
	`id` text(128) PRIMARY KEY NOT NULL,
	`user_id` text(15) NOT NULL,
	`active_expires` integer NOT NULL,
	`idle_expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `team` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`description` text(255)
);
--> statement-breakpoint
CREATE TABLE `team_user` (
	`user_id` text(15) NOT NULL,
	`team_id` integer NOT NULL,
	PRIMARY KEY(`team_id`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `token` (
	`id` text(63) PRIMARY KEY NOT NULL,
	`user_id` text(15) NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text(15) PRIMARY KEY NOT NULL,
	`email` text(32) NOT NULL,
	`email_verified` integer NOT NULL,
	`name` text(255) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);