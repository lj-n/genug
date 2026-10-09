CREATE TABLE `checkpoints` (
	`account_id` text NOT NULL,
	`adjustment` integer,
	`bank_balance` integer NOT NULL,
	`budget_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`created_by` text,
	`id` text PRIMARY KEY,
	CONSTRAINT `fk_checkpoints_account_id_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_checkpoints_budget_id_budgets_id_fk` FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_checkpoints_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_checkpoints_account_id_budget_id_accounts_id_budget_id_fk` FOREIGN KEY (`account_id`,`budget_id`) REFERENCES `accounts`(`id`,`budget_id`)
);
--> statement-breakpoint
ALTER TABLE `transactions` ADD `checkpoint_id` text REFERENCES checkpoints(id) ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX `checkpoint_account_created` ON `checkpoints` (`account_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `transaction_checkpoint` ON `transactions` (`checkpoint_id`);