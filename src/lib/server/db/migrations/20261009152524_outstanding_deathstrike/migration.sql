ALTER TABLE `users` ADD `checkpoint_count_threshold` integer DEFAULT 25;--> statement-breakpoint
ALTER TABLE `users` ADD `checkpoint_days_threshold` integer DEFAULT 30;