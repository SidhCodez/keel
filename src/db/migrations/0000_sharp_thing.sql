CREATE TABLE `active_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`accumulated_ms` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_active_project_idx` ON `active_sessions` (`project_id`);--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `habit_freezes` (
	`id` text PRIMARY KEY NOT NULL,
	`year_month` text NOT NULL,
	`freezes_used` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `habit_freezes_year_month_unique` ON `habit_freezes` (`year_month`);--> statement-breakpoint
CREATE TABLE `habit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`habit_id` text NOT NULL,
	`date` text NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `habit_date_unique_idx` ON `habit_logs` (`habit_id`,`date`);--> statement-breakpoint
CREATE INDEX `habit_logs_date_idx` ON `habit_logs` (`date`);--> statement-breakpoint
CREATE TABLE `habits` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`repeat_type` text DEFAULT 'daily' NOT NULL,
	`repeat_days` text,
	`reminder_time` text,
	`reminder_type` text DEFAULT 'nudge' NOT NULL,
	`color` text DEFAULT '#38BDF8',
	`icon` text DEFAULT 'flame',
	`archived_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `journal_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`elapsed_seconds` integer DEFAULT 0 NOT NULL,
	`last_saved_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text DEFAULT 'daily' NOT NULL,
	`date` text NOT NULL,
	`start_time` integer NOT NULL,
	`finish_time` integer NOT NULL,
	`duration_seconds` integer NOT NULL,
	`content` text NOT NULL,
	`interruptions_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `journal_date_type_idx` ON `journal_entries` (`date`,`type`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`timestamp_str` text,
	`timestamp_seconds` integer,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notes_project_idx` ON `notes` (`project_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`type` text DEFAULT 'task' NOT NULL,
	`link` text,
	`description` text,
	`deadline` text,
	`total_units` integer,
	`completed_units` integer DEFAULT 0 NOT NULL,
	`unit_label` text DEFAULT 'units',
	`resume_marker` text,
	`status` text DEFAULT 'not_started' NOT NULL,
	`slip_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE INDEX `projects_deadline_idx` ON `projects` (`deadline`);--> statement-breakpoint
CREATE INDEX `projects_status_idx` ON `projects` (`status`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer NOT NULL,
	`duration_seconds` integer NOT NULL,
	`stopped_at_marker` text,
	`auto_paused_by_guard` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_project_idx` ON `sessions` (`project_id`);--> statement-breakpoint
CREATE INDEX `sessions_started_idx` ON `sessions` (`started_at`);