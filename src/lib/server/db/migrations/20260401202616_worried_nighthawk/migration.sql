CREATE TABLE `accounts` (
	`archived_at` integer,
	`budget_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`notes` text,
	CONSTRAINT `fk_accounts_budget_id_budgets_id_fk` FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON DELETE CASCADE,
	CONSTRAINT `account_name_budget_unique` UNIQUE(`name`,`budget_id`)
);
--> statement-breakpoint
CREATE TABLE `budget_assignments` (
	`amount` integer NOT NULL,
	`budget_id` text NOT NULL,
	`category_id` text NOT NULL,
	`month` integer NOT NULL,
	CONSTRAINT `budget_assignments_pk` PRIMARY KEY(`category_id`, `month`),
	CONSTRAINT `fk_budget_assignments_budget_id_budgets_id_fk` FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_budget_assignments_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_budget_assignments_category_id_budget_id_categories_id_budget_id_fk` FOREIGN KEY (`category_id`,`budget_id`) REFERENCES `categories`(`id`,`budget_id`),
	CONSTRAINT "date_format" CHECK("month" between 190001 and 210012 AND "month" % 100 between 1 and 12)
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`created_at` integer NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`id` text PRIMARY KEY,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users_to_budgets` (
	`budget_id` text NOT NULL,
	`role` text NOT NULL,
	`user_id` text NOT NULL,
	CONSTRAINT `users_to_budgets_pk` PRIMARY KEY(`user_id`, `budget_id`),
	CONSTRAINT `fk_users_to_budgets_budget_id_budgets_id_fk` FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_users_to_budgets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`archived_at` integer,
	`budget_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`notes` text,
	`target_balance` integer,
	CONSTRAINT `fk_categories_budget_id_budgets_id_fk` FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON DELETE CASCADE,
	CONSTRAINT `category_name_budget_unique` UNIQUE(`name`,`budget_id`),
	CONSTRAINT "target_balance_positive" CHECK("target_balance" > 0)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`account_id` text NOT NULL,
	`amount` integer NOT NULL,
	`budget_id` text NOT NULL,
	`category_id` text,
	`created_at` integer NOT NULL,
	`created_by` text,
	`date` text NOT NULL,
	`id` text PRIMARY KEY,
	`notes` text,
	`validated` integer DEFAULT false NOT NULL,
	CONSTRAINT `fk_transactions_account_id_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_transactions_budget_id_budgets_id_fk` FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_transactions_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_transactions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_transactions_account_id_budget_id_accounts_id_budget_id_fk` FOREIGN KEY (`account_id`,`budget_id`) REFERENCES `accounts`(`id`,`budget_id`),
	CONSTRAINT `fk_transactions_category_id_budget_id_categories_id_budget_id_fk` FOREIGN KEY (`category_id`,`budget_id`) REFERENCES `categories`(`id`,`budget_id`),
	CONSTRAINT "date_format" CHECK("date" LIKE '____-__-__')
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`expires_at` integer NOT NULL,
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	CONSTRAINT `fk_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_account_order` (
	`account_id` text NOT NULL,
	`position` integer NOT NULL,
	`user_id` text NOT NULL,
	CONSTRAINT `user_account_order_pk` PRIMARY KEY(`user_id`, `account_id`),
	CONSTRAINT `fk_user_account_order_account_id_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_user_account_order_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_budget_order` (
	`budget_id` text NOT NULL,
	`position` integer NOT NULL,
	`user_id` text NOT NULL,
	CONSTRAINT `user_budget_order_pk` PRIMARY KEY(`user_id`, `budget_id`),
	CONSTRAINT `fk_user_budget_order_budget_id_budgets_id_fk` FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_user_budget_order_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_category_order` (
	`category_id` text NOT NULL,
	`position` integer NOT NULL,
	`user_id` text NOT NULL,
	CONSTRAINT `user_category_order_pk` PRIMARY KEY(`user_id`, `category_id`),
	CONSTRAINT `fk_user_category_order_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_user_category_order_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `users` (
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY,
	`isAdmin` integer DEFAULT false NOT NULL,
	`password_hash` text NOT NULL,
	`username` text NOT NULL CONSTRAINT `username_unique` UNIQUE
);
--> statement-breakpoint
CREATE INDEX `account_active` ON `accounts` (`budget_id`) WHERE "accounts"."archived_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `account_budget_unique` ON `accounts` (`id`,`budget_id`);--> statement-breakpoint
CREATE INDEX `budget_assignment_month` ON `budget_assignments` (`budget_id`,`month`);--> statement-breakpoint
CREATE INDEX `category_active` ON `categories` (`budget_id`) WHERE "categories"."archived_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `category_budget_unique` ON `categories` (`id`,`budget_id`);--> statement-breakpoint
CREATE INDEX `transaction_budget` ON `transactions` (`budget_id`);--> statement-breakpoint
CREATE INDEX `transaction_account` ON `transactions` (`account_id`);--> statement-breakpoint
CREATE INDEX `transaction_account_date` ON `transactions` (`account_id`,`date`);--> statement-breakpoint
CREATE INDEX `session_user` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `admin_unique` ON `users` (`isAdmin`) WHERE "users"."isAdmin" = 1;