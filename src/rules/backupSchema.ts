import { z } from 'zod';

// ============================================================================
// Pure Zod Validation Schemas for Keel Data Backup & Restore
// ============================================================================

export const HabitSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  repeatType: z.enum(['daily', 'weekdays', 'custom']),
  repeatDays: z.string().nullable().optional(),
  reminderTime: z.string().nullable().optional(),
  reminderType: z.enum(['nudge', 'alarm', 'escalate']),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  archivedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const HabitLogSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  date: z.string(),
  status: z.enum(['completed', 'frozen', 'skipped']),
  createdAt: z.string(),
});

export const HabitFreezeSchema = z.object({
  id: z.string(),
  yearMonth: z.string(),
  freezesUsed: z.number().int().min(0).max(2),
  updatedAt: z.string(),
});

export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  type: z.enum(['course', 'video', 'documentation', 'task', 'brainstorm']),
  link: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  totalUnits: z.number().nullable().optional(),
  completedUnits: z.number().int().default(0),
  unitLabel: z.string().nullable().optional(),
  resumeMarker: z.string().nullable().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  slipCount: z.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable().optional(),
});

export const SessionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  startedAt: z.number(),
  endedAt: z.number(),
  durationSeconds: z.number().int().min(0),
  stoppedAtMarker: z.string().nullable().optional(),
  autoPausedByGuard: z.boolean().or(z.number()).transform((v) => Boolean(v)),
  createdAt: z.string(),
});

export const NoteSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  timestampStr: z.string().nullable().optional(),
  timestampSeconds: z.number().nullable().optional(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const JournalEntrySchema = z.object({
  id: z.string(),
  type: z.enum(['daily', 'weekly']),
  date: z.string(),
  startTime: z.number(),
  finishTime: z.number(),
  durationSeconds: z.number().int(),
  content: z.string(),
  interruptionsCount: z.number().int().default(0),
  createdAt: z.string(),
});

export const JournalDraftSchema = z.object({
  id: z.string(),
  date: z.string(),
  content: z.string(),
  elapsedSeconds: z.number().int(),
  lastSavedAt: z.number(),
});

export const AppSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
  updatedAt: z.string(),
});

export const KeelBackupSchema = z.object({
  version: z.literal(1),
  appName: z.literal('Keel'),
  exportedAt: z.string(),
  data: z.object({
    habits: z.array(HabitSchema),
    habitLogs: z.array(HabitLogSchema),
    habitFreezes: z.array(HabitFreezeSchema),
    projects: z.array(ProjectSchema),
    sessions: z.array(SessionSchema),
    notes: z.array(NoteSchema),
    journalEntries: z.array(JournalEntrySchema),
    journalDrafts: z.array(JournalDraftSchema),
    appSettings: z.array(AppSettingSchema),
  }),
});

export type KeelBackup = z.infer<typeof KeelBackupSchema>;
