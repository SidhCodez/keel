import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

// ==========================================
// 1. HABITS & HABIT LOGS
// ==========================================

export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(), // UUID v4
  name: text('name').notNull(),
  repeatType: text('repeat_type', { enum: ['daily', 'weekdays', 'custom'] }).notNull().default('daily'),
  repeatDays: text('repeat_days'), // JSON array: "[1, 3, 5]" (1=Mon, 7=Sun)
  reminderTime: text('reminder_time'), // "HH:mm" (e.g. "07:30")
  reminderType: text('reminder_type', { enum: ['nudge', 'alarm', 'escalate'] }).notNull().default('nudge'),
  color: text('color').default('#38BDF8'),
  icon: text('icon').default('flame'),
  archivedAt: text('archived_at'), // ISO string if archived
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const habitLogs = sqliteTable('habit_logs', {
  id: text('id').primaryKey(),
  habitId: text('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // "YYYY-MM-DD"
  status: text('status', { enum: ['completed', 'frozen', 'skipped'] }).notNull().default('completed'),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  habitDateUnique: uniqueIndex('habit_date_unique_idx').on(table.habitId, table.date),
  dateIdx: index('habit_logs_date_idx').on(table.date),
}));

export const habitFreezes = sqliteTable('habit_freezes', {
  id: text('id').primaryKey(),
  yearMonth: text('year_month').notNull().unique(), // "YYYY-MM"
  freezesUsed: integer('freezes_used').notNull().default(0), // Max 2 per month
  updatedAt: text('updated_at').notNull(),
});

// ==========================================
// 2. PROJECTS, SESSIONS, & NOTES
// ==========================================

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  type: text('type', { 
    enum: ['course', 'video', 'documentation', 'task', 'brainstorm'] 
  }).notNull().default('task'),
  link: text('link'), // URL to course, video, or doc
  description: text('description'),
  deadline: text('deadline'), // "YYYY-MM-DD"
  totalUnits: integer('total_units'), // e.g. 30 lessons or 250 pages
  completedUnits: integer('completed_units').notNull().default(0),
  unitLabel: text('unit_label').default('units'), // 'lessons', 'pages', 'chapters'
  resumeMarker: text('resume_marker'), // e.g. "14:32" or "Lesson 12"
  status: text('status', { 
    enum: ['not_started', 'in_progress', 'completed'] 
  }).notNull().default('not_started'),
  slipCount: integer('slip_count').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  completedAt: text('completed_at'),
}, (table) => ({
  deadlineIdx: index('projects_deadline_idx').on(table.deadline),
  statusIdx: index('projects_status_idx').on(table.status),
}));

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  startedAt: integer('started_at').notNull(), // Epoch milliseconds
  endedAt: integer('ended_at').notNull(),     // Epoch milliseconds
  durationSeconds: integer('duration_seconds').notNull(),
  stoppedAtMarker: text('stopped_at_marker'), // Captured during pause
  autoPausedByGuard: integer('auto_paused_by_guard', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  projectSessionIdx: index('sessions_project_idx').on(table.projectId),
  startedAtIdx: index('sessions_started_idx').on(table.startedAt),
}));

export const activeSessions = sqliteTable('active_sessions', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  startedAt: integer('started_at').notNull(), // Epoch ms
  accumulatedMs: integer('accumulated_ms').notNull().default(0),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  uniqueActiveProject: uniqueIndex('unique_active_project_idx').on(table.projectId),
}));

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  timestampStr: text('timestamp_str'), // e.g. "12:40"
  timestampSeconds: integer('timestamp_seconds'), // e.g. 760
  content: text('content').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  projectNoteIdx: index('notes_project_idx').on(table.projectId),
}));

// ==========================================
// 3. JOURNAL & APP SETTINGS
// ==========================================

export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['daily', 'weekly'] }).notNull().default('daily'),
  date: text('date').notNull(), // "YYYY-MM-DD"
  startTime: integer('start_time').notNull(), // Epoch ms
  finishTime: integer('finish_time').notNull(), // Epoch ms
  durationSeconds: integer('duration_seconds').notNull(), // 600 for daily, 1200 for weekly
  content: text('content').notNull(),
  interruptionsCount: integer('interruptions_count').notNull().default(0),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  journalDateTypeUnique: uniqueIndex('journal_date_type_idx').on(table.date, table.type),
}));

export const journalDrafts = sqliteTable('journal_drafts', {
  id: text('id').primaryKey(), // 'daily' or 'weekly'
  date: text('date').notNull(),
  content: text('content').notNull().default(''),
  elapsedSeconds: integer('elapsed_seconds').notNull().default(0),
  lastSavedAt: integer('last_saved_at').notNull(),
});

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Infer types
export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type HabitLog = typeof habitLogs.$inferSelect;
export type NewHabitLog = typeof habitLogs.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type ActiveSession = typeof activeSessions.$inferSelect;
export type NewActiveSession = typeof activeSessions.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;
export type JournalDraft = typeof journalDrafts.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
