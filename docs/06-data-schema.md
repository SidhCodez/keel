# 06. Data Schema & Persistence Specification: Keel

## 1. Database Architecture Overview

Keel runs on an embedded, local SQLite database managed by **`expo-sqlite`** and typed via **Drizzle ORM**.

- **Database File**: `keel.db`
- **Dialect**: SQLite 3 with WAL (Write-Ahead Logging) enabled.
- **Foreign Keys**: Enabled (`PRAGMA foreign_keys = ON`).
- **Date Handling**: All dates are stored as ISO-8601 strings (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`) or epoch integers (milliseconds) for high-precision timer math.

---

## 2. Drizzle ORM Schema Definitions

### 2.1 Habits & Habit Logs

```typescript
import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

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
```

---

### 2.2 Projects, Sessions, and Notes

```typescript
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
```

---

### 2.3 Journal & App Settings

```typescript
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
```

---

## 3. Critical Analytical SQL Queries

### 3.1 Fetch Pending Today Items
```sql
-- Work Pending Today (deadline <= today and not completed)
SELECT * FROM projects 
WHERE status != 'completed' 
  AND (deadline IS NOT NULL AND deadline <= :todayDate)
ORDER BY deadline ASC;

-- Habits Pending Today
SELECT h.* FROM habits h
LEFT JOIN habit_logs hl 
  ON h.id = hl.habit_id AND hl.date = :todayDate
WHERE h.archived_at IS NULL
  AND hl.id IS NULL;
```

### 3.2 Time Invested Per Project & Per Type
```sql
SELECT 
  p.type,
  SUM(s.duration_seconds) AS total_seconds,
  COUNT(s.id) AS session_count
FROM sessions s
JOIN projects p ON s.project_id = p.id
GROUP BY p.type;
```

### 3.3 90-Day Habit Completion Heatmap
```sql
SELECT 
  hl.date,
  COUNT(hl.id) AS completed_count
FROM habit_logs hl
WHERE hl.status IN ('completed', 'frozen')
  AND hl.date >= :startDate90DaysAgo
GROUP BY hl.date
ORDER BY hl.date ASC;
```

---

## 4. JSON Backup & Restore Schema (Zod Validation)

To ensure full user sovereignty, Keel supports one-tap database export to a `.json` backup file.

```typescript
import { z } from 'zod';

export const KeelBackupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  data: z.object({
    habits: z.array(z.object({
      id: z.string().uuid(),
      name: z.string(),
      repeatType: z.enum(['daily', 'weekdays', 'custom']),
      repeatDays: z.string().nullable(),
      reminderTime: z.string().nullable(),
      reminderType: z.enum(['nudge', 'alarm', 'escalate']),
      color: z.string().nullable(),
      icon: z.string().nullable(),
      archivedAt: z.string().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })),
    habitLogs: z.array(z.object({
      id: z.string().uuid(),
      habitId: z.string().uuid(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      status: z.enum(['completed', 'frozen', 'skipped']),
      createdAt: z.string(),
    })),
    projects: z.array(z.object({
      id: z.string().uuid(),
      title: z.string(),
      type: z.enum(['course', 'video', 'documentation', 'task', 'brainstorm']),
      link: z.string().nullable(),
      description: z.string().nullable(),
      deadline: z.string().nullable(),
      totalUnits: z.number().nullable(),
      completedUnits: z.number(),
      unitLabel: z.string().nullable(),
      resumeMarker: z.string().nullable(),
      status: z.enum(['not_started', 'in_progress', 'completed']),
      slipCount: z.number(),
      createdAt: z.string(),
      updatedAt: z.string(),
      completedAt: z.string().nullable(),
    })),
    sessions: z.array(z.object({
      id: z.string().uuid(),
      projectId: z.string().uuid(),
      startedAt: z.number(),
      endedAt: z.number(),
      durationSeconds: z.number(),
      stoppedAtMarker: z.string().nullable(),
      autoPausedByGuard: z.boolean(),
      createdAt: z.string(),
    })),
    notes: z.array(z.object({
      id: z.string().uuid(),
      projectId: z.string().uuid(),
      timestampStr: z.string().nullable(),
      timestampSeconds: z.number().nullable(),
      content: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })),
    journalEntries: z.array(z.object({
      id: z.string().uuid(),
      type: z.enum(['daily', 'weekly']),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      startTime: z.number(),
      finishTime: z.number(),
      durationSeconds: z.number(),
      content: z.string(),
      interruptionsCount: z.number(),
      createdAt: z.string(),
    })),
  }),
});

export type KeelBackup = z.infer<typeof KeelBackupSchema>;
```
