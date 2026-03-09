CREATE TABLE `player_property` (
	`id` text PRIMARY KEY NOT NULL,
	`tablero_id` text NOT NULL,
	`player_id` text NOT NULL,
	`property_key` text NOT NULL,
	`houses` integer DEFAULT 0 NOT NULL,
	`has_hotel` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`tablero_id`) REFERENCES `tablero`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `player_property_tableroId_idx` ON `player_property` (`tablero_id`);
--> statement-breakpoint
CREATE INDEX `player_property_playerId_idx` ON `player_property` (`player_id`);
--> statement-breakpoint
CREATE INDEX `player_property_propertyKey_idx` ON `player_property` (`property_key`);
--> statement-breakpoint
CREATE INDEX `player_property_tablero_property_idx` ON `player_property` (`tablero_id`,`property_key`);
