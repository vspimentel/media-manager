CREATE TABLE `movies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`duration` text NOT NULL,
	`folder` text NOT NULL,
	`poster` text,
	`tmdb_id` integer,
	`cache_key` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `movies_folder_unique` ON `movies` (`folder`);