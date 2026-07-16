ALTER TABLE `transactions` ADD `transfer_id` text;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`account_id` text NOT NULL,
	`amount` integer NOT NULL,
	`budget_id` text NOT NULL,
	`category_id` text,
	`created_at` integer NOT NULL,
	`created_by` text,
	`date` text NOT NULL,
	`id` text PRIMARY KEY,
	`notes` text,
	`transfer_id` text,
	`validated` integer DEFAULT false NOT NULL,
	CONSTRAINT `fk_transactions_account_id_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_transactions_budget_id_budgets_id_fk` FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_transactions_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_transactions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_transactions_account_id_budget_id_accounts_id_budget_id_fk` FOREIGN KEY (`account_id`,`budget_id`) REFERENCES `accounts`(`id`,`budget_id`),
	CONSTRAINT `fk_transactions_category_id_budget_id_categories_id_budget_id_fk` FOREIGN KEY (`category_id`,`budget_id`) REFERENCES `categories`(`id`,`budget_id`),
	CONSTRAINT "date_format" CHECK("date" LIKE '____-__-__'),
	CONSTRAINT "transfer_no_category" CHECK("transfer_id" IS NULL OR "category_id" IS NULL)
);
--> statement-breakpoint
INSERT INTO `__new_transactions`(`account_id`, `amount`, `budget_id`, `category_id`, `created_at`, `created_by`, `date`, `id`, `notes`, `validated`) SELECT `account_id`, `amount`, `budget_id`, `category_id`, `created_at`, `created_by`, `date`, `id`, `notes`, `validated` FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `transaction_budget` ON `transactions` (`budget_id`);--> statement-breakpoint
CREATE INDEX `transaction_account` ON `transactions` (`account_id`);--> statement-breakpoint
CREATE INDEX `transaction_account_date` ON `transactions` (`account_id`,`date`);--> statement-breakpoint
CREATE INDEX `transaction_transfer` ON `transactions` (`transfer_id`);