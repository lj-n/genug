ALTER TABLE `user` ADD COLUMN `hashed_password` text(255);--> statement-breakpoint

UPDATE `user`
SET `hashed_password` = (
    SELECT `user_key`.`hashed_password`
    FROM `user_key`
    WHERE `user_key`.`user_id` = `user`.`id`
)
WHERE `id` IN (
    SELECT `user_id`
    FROM `user_key`
    WHERE `user_key`.`hashed_password` IS NOT NULL
);--> statement-breakpoint

DROP TABLE `user_key`;--> statement-breakpoint
ALTER TABLE user_session ADD `expires_at` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `user_session` DROP COLUMN `active_expires`;--> statement-breakpoint
ALTER TABLE `user_session` DROP COLUMN `idle_expires`;