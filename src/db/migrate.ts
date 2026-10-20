import { sqlite } from './client';

export const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS active_sessions (
	id text PRIMARY KEY NOT NULL,
	project_id text NOT NULL,
	started_at integer NOT NULL,
	accumulated_ms integer DEFAULT 0 NOT NULL,
	updated_at integer NOT NULL,
	FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_project_idx ON active_sessions (project_id);

CREATE TABLE IF NOT EXISTS app_settings (
	key text PRIMARY KEY NOT NULL,
	value text NOT NULL,
	updated_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS habit_freezes (
	id text PRIMARY KEY NOT NULL,
	year_month text NOT NULL,
	freezes_used integer DEFAULT 0 NOT NULL,
	updated_at text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS habit_freezes_year_month_unique ON habit_freezes (year_month);

CREATE TABLE IF NOT EXISTS habits (
	id text PRIMARY KEY NOT NULL,
	name text NOT NULL,
	repeat_type text DEFAULT 'daily' NOT NULL,
	repeat_days text,
	reminder_time text,
	reminder_type text DEFAULT 'nudge' NOT NULL,
	color text DEFAULT '#38BDF8',
	icon text DEFAULT 'flame',
	archived_at text,
	created_at text NOT NULL,
	updated_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS habit_logs (
	id text PRIMARY KEY NOT NULL,
	habit_id text NOT NULL,
	date text NOT NULL,
	status text DEFAULT 'completed' NOT NULL,
	created_at text NOT NULL,
	FOREIGN KEY (habit_id) REFERENCES habits(id) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS habit_date_unique_idx ON habit_logs (habit_id, date);
CREATE INDEX IF NOT EXISTS habit_logs_date_idx ON habit_logs (date);

CREATE TABLE IF NOT EXISTS journal_drafts (
	id text PRIMARY KEY NOT NULL,
	date text NOT NULL,
	content text DEFAULT '' NOT NULL,
	elapsed_seconds integer DEFAULT 0 NOT NULL,
	last_saved_at integer NOT NULL
);

CREATE TABLE IF NOT EXISTS journal_entries (
	id text PRIMARY KEY NOT NULL,
	type text DEFAULT 'daily' NOT NULL,
	date text NOT NULL,
	start_time integer NOT NULL,
	finish_time integer NOT NULL,
	duration_seconds integer NOT NULL,
	content text NOT NULL,
	interruptions_count integer DEFAULT 0 NOT NULL,
	created_at text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS journal_date_type_idx ON journal_entries (date, type);

CREATE TABLE IF NOT EXISTS projects (
	id text PRIMARY KEY NOT NULL,
	title text NOT NULL,
	type text DEFAULT 'task' NOT NULL,
	link text,
	description text,
	deadline text,
	total_units integer,
	completed_units integer DEFAULT 0 NOT NULL,
	unit_label text DEFAULT 'units',
	resume_marker text,
	status text DEFAULT 'not_started' NOT NULL,
	slip_count integer DEFAULT 0 NOT NULL,
	created_at text NOT NULL,
	updated_at text NOT NULL,
	completed_at text
);
CREATE INDEX IF NOT EXISTS projects_deadline_idx ON projects (deadline);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects (status);

CREATE TABLE IF NOT EXISTS notes (
	id text PRIMARY KEY NOT NULL,
	project_id text NOT NULL,
	timestamp_str text,
	timestamp_seconds integer,
	content text NOT NULL,
	created_at text NOT NULL,
	updated_at text NOT NULL,
	FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS notes_project_idx ON notes (project_id);

CREATE TABLE IF NOT EXISTS sessions (
	id text PRIMARY KEY NOT NULL,
	project_id text NOT NULL,
	started_at integer NOT NULL,
	ended_at integer NOT NULL,
	duration_seconds integer NOT NULL,
	stopped_at_marker text,
	auto_paused_by_guard integer DEFAULT 0 NOT NULL,
	created_at text NOT NULL,
	FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS sessions_project_idx ON sessions (project_id);
CREATE INDEX IF NOT EXISTS sessions_started_idx ON sessions (started_at);
`;

export function runMigrations(): void {
  sqlite.execSync(MIGRATION_SQL);
}

export function getAllTableNames(): string[] {
  const result = sqlite.getAllSync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`
  );
  return result.map(r => r.name).sort();
}
