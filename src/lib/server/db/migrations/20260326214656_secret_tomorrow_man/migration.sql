CREATE TABLE `sessions` (
	`expires_at` integer NOT NULL,
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	CONSTRAINT `fk_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `users` (
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY,
	`isAdmin` integer DEFAULT false NOT NULL,
	`password_hash` text NOT NULL,
	`username` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_unique` ON `users` (`isAdmin`) WHERE "users"."isAdmin" = 1;--> statement-breakpoint
CREATE UNIQUE INDEX `username_unique` ON `users` (`username`);