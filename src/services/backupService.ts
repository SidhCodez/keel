import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { z } from 'zod';
import { db } from '@/db/client';
import {
  habits,
  habitLogs,
  habitFreezes,
  projects,
  sessions,
  activeSessions,
  notes,
  journalEntries,
  journalDrafts,
  appSettings,
} from '@/db/schema';
import { rescheduleAllReminders } from './reminderScheduler';
import { cancelAllNotifications } from './notificationService';

export {
  HabitSchema,
  HabitLogSchema,
  HabitFreezeSchema,
  ProjectSchema,
  SessionSchema,
  NoteSchema,
  JournalEntrySchema,
  JournalDraftSchema,
  AppSettingSchema,
  KeelBackupSchema,
  type KeelBackup,
} from '@/rules/backupSchema';
import { KeelBackupSchema, KeelBackup } from '@/rules/backupSchema';

// ============================================================================
// 2. Export Backup
// ============================================================================

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export async function exportKeelBackup(): Promise<ExportResult> {
  try {
    const [
      allHabits,
      allHabitLogs,
      allHabitFreezes,
      allProjects,
      allSessions,
      allNotes,
      allJournalEntries,
      allJournalDrafts,
      allAppSettings,
    ] = await Promise.all([
      db.select().from(habits),
      db.select().from(habitLogs),
      db.select().from(habitFreezes),
      db.select().from(projects),
      db.select().from(sessions),
      db.select().from(notes),
      db.select().from(journalEntries),
      db.select().from(journalDrafts),
      db.select().from(appSettings),
    ]);

    const backupData: KeelBackup = {
      version: 1,
      appName: 'Keel',
      exportedAt: new Date().toISOString(),
      data: {
        habits: allHabits as any,
        habitLogs: allHabitLogs as any,
        habitFreezes: allHabitFreezes as any,
        projects: allProjects as any,
        sessions: allSessions as any,
        notes: allNotes as any,
        journalEntries: allJournalEntries as any,
        journalDrafts: allJournalDrafts as any,
        appSettings: allAppSettings as any,
      },
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const dateTag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `keel_backup_${dateTag}.json`;
    const targetPath = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? ''}${fileName}`;

    await FileSystem.writeAsStringAsync(targetPath, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(targetPath, {
        mimeType: 'application/json',
        dialogTitle: 'Save or Share Keel Backup',
        UTI: 'public.json',
      });
    }

    return {
      success: true,
      filePath: targetPath,
    };
  } catch (err: any) {
    console.error('[BackupService] Export failed:', err);
    return {
      success: false,
      error: err?.message ?? 'Unknown export error',
    };
  }
}

// ============================================================================
// 3. Import Backup
// ============================================================================

export interface ImportResult {
  success: boolean;
  message?: string;
  counts?: {
    habits: number;
    projects: number;
    sessions: number;
    journalEntries: number;
  };
  error?: string;
}

export async function importKeelBackup(): Promise<ImportResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, error: 'Import cancelled by user' };
    }

    const fileUri = result.assets[0]?.uri;
    if (!fileUri) {
      return { success: false, error: 'Invalid file selected' };
    }

    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(fileContent);
    } catch {
      return { success: false, error: 'Selected file is not valid JSON' };
    }

    // Validate with Zod
    const parseResult = KeelBackupSchema.safeParse(rawJson);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return {
        success: false,
        error: `Validation error in ${issue?.path.join('.') ?? 'file'}: ${issue?.message ?? 'Invalid format'}`,
      };
    }

    const { data } = parseResult.data;

    // Clear existing tables in SQLite
    await db.delete(activeSessions);
    await db.delete(sessions);
    await db.delete(notes);
    await db.delete(projects);
    await db.delete(habitLogs);
    await db.delete(habitFreezes);
    await db.delete(habits);
    await db.delete(journalEntries);
    await db.delete(journalDrafts);
    await db.delete(appSettings);

    // Insert backup data
    if (data.habits.length > 0) {
      for (const h of data.habits) {
        await db.insert(habits).values(h);
      }
    }

    if (data.habitLogs.length > 0) {
      for (const hl of data.habitLogs) {
        await db.insert(habitLogs).values(hl);
      }
    }

    if (data.habitFreezes.length > 0) {
      for (const hf of data.habitFreezes) {
        await db.insert(habitFreezes).values(hf);
      }
    }

    if (data.projects.length > 0) {
      for (const p of data.projects) {
        await db.insert(projects).values(p);
      }
    }

    if (data.sessions.length > 0) {
      for (const s of data.sessions) {
        await db.insert(sessions).values(s);
      }
    }

    if (data.notes.length > 0) {
      for (const n of data.notes) {
        await db.insert(notes).values(n);
      }
    }

    if (data.journalEntries.length > 0) {
      for (const j of data.journalEntries) {
        await db.insert(journalEntries).values(j);
      }
    }

    if (data.journalDrafts.length > 0) {
      for (const jd of data.journalDrafts) {
        await db.insert(journalDrafts).values(jd);
      }
    }

    if (data.appSettings.length > 0) {
      for (const a of data.appSettings) {
        await db.insert(appSettings).values(a);
      }
    }

    // Reschedule all reminders to reflect restored data
    await rescheduleAllReminders().catch((err) => {
      console.warn('[BackupService] Failed to reschedule reminders after restore:', err);
    });

    return {
      success: true,
      message: 'Backup restored successfully',
      counts: {
        habits: data.habits.length,
        projects: data.projects.length,
        sessions: data.sessions.length,
        journalEntries: data.journalEntries.length,
      },
    };
  } catch (err: any) {
    console.error('[BackupService] Import failed:', err);
    return {
      success: false,
      error: err?.message ?? 'Unknown restore error',
    };
  }
}

// ============================================================================
// 4. Wipe All Data
// ============================================================================

export async function resetAllKeelData(): Promise<void> {
  await cancelAllNotifications();
  await db.delete(activeSessions);
  await db.delete(sessions);
  await db.delete(notes);
  await db.delete(projects);
  await db.delete(habitLogs);
  await db.delete(habitFreezes);
  await db.delete(habits);
  await db.delete(journalEntries);
  await db.delete(journalDrafts);
  await db.delete(appSettings);
  console.log('[BackupService] 100% of local database wiped.');
}
