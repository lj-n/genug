CREATE TABLE `accounts` (
	`id` text PRIMARY KEY,
	`created_at` integer NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`budget_id` text NOT NULL,
	CONSTRAINT `fk_accounts_budget_id_budgets_id_fk` FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON DELETE CASCADE,
	CONSTRAINT `account_name_budget_unique` UNIQUE(`name`,`budget_id`)
);
--> statement-breakpoint
CREATE TABLE `budget_assignments` (
	`budget_id` text NOT NULL,
	`category_id` text NOT NULL,
	`amount` integer NOT NULL,
	`month` integer NOT NULL,
	CONSTRAINT `budget_assignments_pk` PRIMARY KEY(`category_id`, `month`),
	CONSTRAINT `fk_budget_assignments_budget_id_budgets_id_fk` FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_budget_assignments_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_budget_assignments_category_id_budget_id_categories_id_budget_id_fk` FOREIGN KEY (`category_id`,`budget_id`) REFERENCES `categories`(`id`,`budget_id`),
	CONSTRAINT "date_format" CHECK("month" between 190001 and 210012 AND "month" % 100 between 1 and 12)
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` text PRIMARY KEY,
	`created_at` integer NOT NULL,
	`name` text NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users_to_budgets` (
	`role` text NOT NULL,
	`user_id` text NOT NULL,
	`budget_id` text NOT NULL,
	CONSTRAINT `users_to_budgets_pk` PRIMARY KEY(`user_id`, `budget_id`),
	CONSTRAINT `fk_users_to_budgets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_users_to_budgets_budget_id_budgets_id_fk` FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY,
	`created_at` integer NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`target_balance` integer,
	`budget_id` text NOT NULL,
	CONSTRAINT `fk_categories_budget_id_budgets_id_fk` FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON DELETE CASCADE,
	CONSTRAINT `category_name_budget_unique` UNIQUE(`name`,`budget_id`),
	CONSTRAINT "target_balance_positive" CHECK("target_balance" > 0)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY,
	`created_at` integer NOT NULL,
	`created_by` text,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`notes` text,
	`budget_id` text NOT NULL,
	`account_id` text NOT NULL,
	`category_id` text,
	`validated` integer DEFAULT false NOT NULL,
	CONSTRAINT `fk_transactions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_transactions_budget_id_budgets_id_fk` FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_transactions_account_id_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_transactions_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_transactions_account_id_budget_id_accounts_id_budget_id_fk` FOREIGN KEY (`account_id`,`budget_id`) REFERENCES `accounts`(`id`,`budget_id`),
	CONSTRAINT `fk_transactions_category_id_budget_id_categories_id_budget_id_fk` FOREIGN KEY (`category_id`,`budget_id`) REFERENCES `categories`(`id`,`budget_id`),
	CONSTRAINT "date_format" CHECK("date" LIKE '____-__-__')
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY,
	`expires_at` integer NOT NULL,
	`user_id` text NOT NULL,
	CONSTRAINT `fk_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_account_order` (
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`position` integer NOT NULL,
	CONSTRAINT `user_account_order_pk` PRIMARY KEY(`user_id`, `account_id`),
	CONSTRAINT `fk_user_account_order_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_user_account_order_account_id_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_budget_order` (
	`user_id` text NOT NULL,
	`budget_id` text NOT NULL,
	`position` integer NOT NULL,
	CONSTRAINT `user_budget_order_pk` PRIMARY KEY(`user_id`, `budget_id`),
	CONSTRAINT `fk_user_budget_order_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_user_budget_order_budget_id_budgets_id_fk` FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_category_order` (
	`user_id` text NOT NULL,
	`category_id` text NOT NULL,
	`position` integer NOT NULL,
	CONSTRAINT `user_category_order_pk` PRIMARY KEY(`user_id`, `category_id`),
	CONSTRAINT `fk_user_category_order_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_user_category_order_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`created_at` integer NOT NULL,
	`isAdmin` integer DEFAULT false NOT NULL,
	`password_hash` text NOT NULL,
	`username` text NOT NULL CONSTRAINT `username_unique` UNIQUE
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_budget_unique` ON `accounts` (`id`,`budget_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `category_budget_unique` ON `categories` (`id`,`budget_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `admin_unique` ON `users` (`isAdmin`) WHERE "users"."isAdmin" = 1;