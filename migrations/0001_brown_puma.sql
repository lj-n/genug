CREATE TABLE `user_profile` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text(15) NOT NULL,
	`image` blob,
	`category_order` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
