CREATE TABLE `api_tokens` (
	`created_at` integer NOT NULL,
	`expires_at` integer,
	`id` text PRIMARY KEY,
	`last_used_at` integer,
	`name` text NOT NULL,
	`token_hash` text NOT NULL UNIQUE,
	`user_id` text NOT NULL,
	CONSTRAINT `fk_api_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `api_token_user` ON `api_tokens` (`user_id`);